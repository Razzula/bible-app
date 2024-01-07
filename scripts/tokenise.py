import json
import os
import re
from nltk.stem import WordNetLemmatizer
from enum import Enum

import token_vis

class MatchStrictness(Enum):
    IDENTICAL = 1
    LEMMAS = 2
    SYNONYMS = 3

IGNORED_CHARS = ''.join(['.', ',', ';', ':', '?', '!', '“', '”', '‘', '’'])

lemmaCache = {
    'spared': ['spare'],
    # 'kinds': ['kind'],
    # 'kind': ['kind'],
}

def tokenisePassage(passage, verse, translation, visualise=False):
    """
    Load, and tokenise, a passage of scripture.
    """

    with open(os.path.join(os.path.dirname(__file__), 'data', translation, translation, passage), 'r') as f:
        data = json.load(f)
    scripture = data[verse - 1]

    with open(os.path.join(os.path.dirname(__file__), 'data', 'strongs', f'{passage}.json'), 'r') as f:
        data = json.load(f)
    strongs = data[str(verse)]

    if (scripture and strongs):
        return tokenise(scripture, strongs, visualise=visualise, usfm=f'{passage}.{verse}')
    return None


def tokenise(scripture, strongs, visualise=False, usfm=None):
    """
    Tokenise a passage of scripture, using a strongs dictionary.
    """

    tokens = []

    # FIRST, BREAK DOWN THE SCRIPTURE INTO INDIVIDUAL TOKENS
    for chunk in scripture:

        if (chunk.get('type') == 'note'):
            tokens.append(chunk) # notes don't need tokenising, but are left in the array to preserve the order
            continue

        if (chunk.get('content') == ' '): # ignore whitespace
            pass

        tokenCandidates = chunk['content'].split(' ') # TODO also split using '-' (in other splittings, too)
        for candidateTokenIndex, candidateToken in enumerate(tokenCandidates):
            if (candidateToken.strip() == ''):
                continue

            token = {}

            # reconstruct
            if (chunk.get('header') and candidateTokenIndex == 0): # this assumes there will never be a heading mid-verse
                token['header'] = chunk['header']

            if (chunk.get('type')):
                token['type'] = chunk['type'] # TODO cannot split paragraphs into multiple (?)

            token['content'] = candidateToken

            tokens.append(token)
        pass
    pass

    #TODO for some translations, the [x] words (it) in strongs should be de-bracketed (perhaps in the strip function?)

    # COUNT NUMBER OF OCCURRENCES OF EACH TOKEN
    tokenCounts = {} # { token: (scriptureCount, strongsCount) }
    lemmaCounts = {}

    for token in tokens:
        # skip notes
        if (token.get('type') == 'note'):
            continue

        tokenContent = simplifyToken(token)

        # genuine content
        exisitngCount = tokenCounts.get(tokenContent)
        if (exisitngCount):
            tokenCounts[tokenContent] = (exisitngCount[0] + 1, exisitngCount[1])
        else:
            tokenCounts[tokenContent] = (1, 0)

        # lemmas
        for lemma in lemmatiseWord(tokenContent):
            exisitngCount = lemmaCounts.get(lemma)
            if (exisitngCount):
                lemmaCounts[lemma] = (exisitngCount[0] + 1, exisitngCount[1])
            else:
                lemmaCounts[lemma] = (1, 0)

    for token in strongs.values():

        tokenContent = simplifyToken(token)
        for word in tokenContent.split(' '):

            # genuine content
            exisitngCount = tokenCounts.get(word)
            if (exisitngCount):
                tokenCounts[word] = (exisitngCount[0], exisitngCount[1] + 1)
            else:
                tokenCounts[word] = (0, 1)

            # lemmas
            for lemma in lemmatiseWord(word):
                exisitngCount = lemmaCounts.get(lemma)
                if (exisitngCount):
                    lemmaCounts[lemma] = (exisitngCount[0], exisitngCount[1] + 1)
                else:
                    lemmaCounts[lemma] = (0, 1)

    ABSTRACT_TOKENS = tokeniseAbstract(tokens, strongs, tokenCounts, lemmaCounts)
    for token in ABSTRACT_TOKENS:
        if ((tokenID := token.get('token', None)) != None):
            tokens[token['index']]['token'] = tokenID

    # CHECK STATUS
    for token in tokens:
        if (tokenIsDirty(token)):
            continue
        pass # FAILURE
        print(token.get('content'))

    if (visualise):
        window = token_vis.Window()
        window.draw(strongs, tokens, title=usfm)

    # RECONSTRUCT TOKENS
    # we originally tokenised the scripture into individual words, whereas the target tokens may be larger chunks,
    # it may be possible to reconstruct the scripture into some larger tokens, which would reduce the number of individual tokens
    newToken = {}
    final_tokens = []
    currentToken = -1 # cannot use 'None', as notes will have this token

    for token in tokens:

        newTokenID = token.get('token')

        if (currentToken != newTokenID): # new token
                if (newToken != {}):
                    final_tokens.append(newToken)

                newToken = token
                currentToken = newTokenID
        else: # same token as previous
            if (token.get('type') == newToken.get('type')):
                newToken['content'] += f' {token["content"]}' # TODO this may not be ideal

    if (newToken != {}): # append last token
        final_tokens.append(newToken)
    pass

    return final_tokens

def tokeniseAbstract(TRUE_TOKENS, strongs, tokenCounts, lemmaCounts):
    """
    Tokenise a passage of scripture, using a strongs dictionary.
    This function uses an 'abstracted' version of the tokens, which is more suitable for matching.
    """

    # abstract tokens
    working_tokens = []
    for tokenIndex, token in enumerate(TRUE_TOKENS):
        if (not tokenIsDirty(token)):
            new_token = token.copy()
            new_token['index'] = tokenIndex
            working_tokens.append(new_token)

    # DO TWO SWEEPS: FIRST USING LITERAL COMPARISON, THEN EXPANDING ACCEPTANCE CRITERIA TO INCLUDE SYNONYMS
    for matchTolerance in [MatchStrictness.IDENTICAL, MatchStrictness.LEMMAS, MatchStrictness.SYNONYMS]:
        pass

        # LINK ANY WHOLE, EXACT, UNIQUE MATCHES
        for strongsTokenID, strongsToken in strongs.items():

            if (strongsToken.get('eng') == '-'):
                continue
            pass

            for scriptureIndex, scriptureToken in enumerate(working_tokens):

                if (tokenIsDirty(scriptureToken)):
                    continue

                if (matchTolerance == MatchStrictness.IDENTICAL):
                    if (tokenCounts.get(simplifyToken(scriptureToken)) == (1, 1)): # UNIQUE
                        if (equals(scriptureToken, strongsToken)): # WHOLE, EXACT
                            # update data to be tokenised
                            scriptureToken['token'] = strongsTokenID
                            working_tokens[scriptureIndex] = scriptureToken
                            continue

                else:
                    if (tokenCounts.get(simplifyToken(strongsToken))): # WHOLE
                        synonym = synonymous(scriptureToken, strongsToken, matchTolerance) # EXACT
                        if (synonym):

                            if (matchTolerance == MatchStrictness.LEMMAS): # TODO this is kinda bad
                                if (len(synonym) > 1):
                                    pass # will this ever occur? # YES: was -> wa, be
                                for lemma in synonym:
                                    if (lemmaCounts[lemma] == (1, 1)): # UNIQUE
                                        # update data to be tokenised
                                        scriptureToken['token'] = strongsTokenID
                                        working_tokens[scriptureIndex] = scriptureToken
                                        continue

                            elif (matchTolerance == MatchStrictness.SYNONYMS):
                                # TODO better ensure uniqueness
                                if (tokenCounts[synonym][0] == 1 and tokenCounts[simplifyToken(strongsToken)][1] == 1): # UNIQUE
                                    # update data to be tokenised
                                    scriptureToken['token'] = strongsTokenID
                                    working_tokens[scriptureIndex] = scriptureToken
                                    continue
        pass

        # LINK UNIQUE, INCOMPLETE MATCHES
        for strongsTokenID, strongsToken in strongs.items():

            if (strongsToken.get('eng') == '-'):
                continue
            pass

            for scriptureIndex, scriptureToken in enumerate(working_tokens):

                if (tokenIsDirty(scriptureToken)):
                    continue

                if (matchTolerance == MatchStrictness.IDENTICAL):
                    if (tokenCounts.get(simplifyToken(scriptureToken)) == (1, 1)): # UNIQUE
                        if (contains(strongsToken, scriptureToken, mustMatchWholeWord=True)):
                            # update data to be tokenised
                            scriptureToken['token'] = strongsTokenID
                            working_tokens[scriptureIndex] = scriptureToken
                            continue

                elif (matchTolerance == MatchStrictness.LEMMAS):
                    pass # TODO GEN.21

                elif (matchTolerance == MatchStrictness.SYNONYMS):
                    for subword in simplifyToken(strongsToken).split(' '): # INCOMPLETE
                        
                        count = tokenCounts.get(subword, (0, 0))[0]
                        if (synonymLists := thesaurus.get(subword)):
                            for synonymList in synonymLists:
                                # TODO if multiple lists contain the same word, this will be counted twice

                                for synonym in synonymList:
                                    if ((tokenCount := tokenCounts.get(synonym, (0,0))[0]) > 0):
                                        count += tokenCount

                            if (count == 1): # UNIQUE
                                synonym = synonymous(scriptureToken, subword, matchTolerance)
                                if (synonym):
                                    # update data to be tokenised
                                    scriptureToken['token'] = strongsTokenID
                                    working_tokens[scriptureIndex] = scriptureToken
                                    continue

                            elif (count > 1):
                                pass
                                # this isn't great in terms of efficiency
                                # as we are iterating over each synonym candidate twice
                                # once here, for uniqueness, and then within the synonym function
                                # TODO do the uniqueness check within the synonym function
        pass

        # # BRIDGE GAPS #note: this is problematic
        # currentToken = None
        # chasm = []
        # for scriptureIndex, scriptureToken in enumerate(working_tokens):

        #     if (scriptureToken.get('type') == 'note'):
        #         continue

        #     scriptureTokenID = scriptureToken.get('token')
        #     if (scriptureTokenID != None):
        #         if (currentToken != scriptureTokenID): # TODO does this work?
        #             currentToken = scriptureTokenID
        #             # clear chasm
        #             chasm = []
        #         else:
        #             # link chasm
        #             for chasmIndex in chasm:
        #                 working_tokens[chasmIndex]['token'] = currentToken
        #     else:
        #         chasm.append(scriptureIndex)
        # pass

        # LINK ARTICLES
        linkArticles(working_tokens, strongs)
        pass

        # REVERT ANOMALIES
        revertAnomalies(working_tokens, strongs)
        pass
    pass

    # HANDLE NON-UNIQUE TOKENS
    # if a token is not unique, it may be possible to infer its true token from its positioning
    # TODO do a first sweep, ignoring articles, then do a final sweep without exemption
    for matchTolerance in [MatchStrictness.IDENTICAL, MatchStrictness.LEMMAS, MatchStrictness.SYNONYMS]:
        
        # get matches
        candidates = {}
        for tokenIndex, scriptureToken in enumerate(working_tokens):
            if (tokenIsDirty(scriptureToken)):
                continue
            if (simplifyToken(scriptureToken) in ARTICLES): # skip articles
                continue

            # TODO could we do a uniqueness check initally to prevent re-treading all the time?
            tempCandidates = []
            
            for strongsTokenID, strongsToken in strongs.items():
                if (strongsToken.get('eng') == '-'):
                    continue

                for word in strongsToken['eng'].split(' '):
                    # if scriptureToken matches strongsToken, mark it as a candidate
                    if (matchTolerance == MatchStrictness.IDENTICAL):
                        if (equals(scriptureToken, word)): # TODO  synonyms, lemmas
                            tempCandidates.append(int(strongsTokenID))
                    
                    elif (matchTolerance == MatchStrictness.LEMMAS):
                        if (lemonymous(scriptureToken, word)):
                            tempCandidates.append(int(strongsTokenID))
                    
                    elif (matchTolerance == MatchStrictness.SYNONYMS):
                        synonyms = synonymous(scriptureToken, word, matchTolerance, exhaustive=True)
                        if (synonyms):
                            tempCandidates.append(int(strongsTokenID))

            if (tempCandidates):
                candidates[tokenIndex] = tempCandidates

        # LINK CLOSEST MATCHES
        for tokenIndex, canidateTokens in candidates.items():
            scriptureTokenPos = tokenIndex / len(working_tokens)
            bestCandidateToken = None

            for candidateToken in canidateTokens:

                # evaluate candidates, using distance metric
                candidateTokenPos = int(candidateToken) / len(strongs)
                delta = abs(scriptureTokenPos - candidateTokenPos)

                if (bestCandidateToken == None or delta < bestCandidateToken[1]):
                    bestCandidateToken = (candidateToken, delta)

            # TODO uniqueness check
            working_tokens[tokenIndex]['token'] = bestCandidateToken[0]
        pass

        # REVERT AGAIN
        revertAnomalies(working_tokens, strongs)
        pass
    
    # LINK ARTICLES
    linkArticles(working_tokens, strongs, allowImplicitArticles=True)
    pass

    # ABSORB LOOSE TOKENS # TODO
    
    # SPECIAL CASES
    # truly|truly --> 'most assuredly', 
    if (tokenCounts.get('truly', (0, 0))[1] >= 2): # 'truly truly' is viable in strongs
        
        for strongsTokenID, strongsToken in strongs.items():
                
                if (strongsToken.get('strongs', None) == '281'): # [281]: 'truly'
                    nextStrongsTokenID = str(int(strongsTokenID) + 1)
                    if (strongs[nextStrongsTokenID].get('strongs', None) == '281'):
                        # truly|truly is present

                        for scriptureIndex, scriptureToken in enumerate(working_tokens):
                            if (tokenIsDirty(scriptureToken)):
                                continue
                    
                            if (scriptureIndex < len(working_tokens) - 1):
                                
                                for translation in [('most', 'assuredly'), ('verily', 'verily'), ('amen', 'amen')]:
                                    if (equals(scriptureToken, translation[0])):
                                        if (equals(working_tokens[scriptureIndex + 1], translation[1])):
                                            working_tokens[scriptureIndex]['token'] = strongsTokenID
                                            working_tokens[scriptureIndex + 1]['token'] = nextStrongsTokenID
                                            break
    pass

    # (GREEK) 'the' --> 'he'/'his' # TODO (she/hers? they/theirs?)
    # TODO

    # x-less <--> without x
    for scriptureIndex, scriptureToken in enumerate(working_tokens):
        if (tokenIsDirty(scriptureToken)):
            continue
        
        # x-less
        match = re.match(r'(\w+)less', simplifyToken(scriptureToken))
        if (match):
            x = match.group(1)

            for strongsTokenID, strongsToken in strongs.items():
                if (contains(strongsToken, x, mustMatchWholeWord=True)): #TODO mustMatchWholeWord?
                    working_tokens[scriptureIndex]['token'] = strongsTokenID
                    break

        # without x
        elif (scriptureIndex < len(working_tokens) - 1):
            if (equals(scriptureToken, 'without')):
                x = simplifyToken(working_tokens[scriptureIndex + 1])
                
                for strongsTokenID, strongsToken in strongs.items():
                    if (contains(strongsToken, f'{x}less', mustMatchWholeWord=True)):
                        # match
                        working_tokens[scriptureIndex]['token'] = strongsTokenID
                        working_tokens[scriptureIndex + 1]['token'] = strongsTokenID
    pass

    return working_tokens

# LINK ARTICLES
ARTICLES = ['the']
def linkArticles(working_tokens, strongs, allowImplicitArticles=False):
    """
    Map articles based off of existing mappings of their respective nouns.
    Accepts both embedded and non-embedded articles.
    """
    for scriptureIndex, scriptureToken in enumerate(working_tokens):

        if (tokenIsDirty(scriptureToken)):
            continue

        for article in ARTICLES:
            if (equals(scriptureToken, article)): # TODO expand
                if (len(working_tokens) > scriptureIndex + 1): # this should always be true, really

                    strongsCandidateID = working_tokens[scriptureIndex + 1].get('token')
                    if (strongsCandidateID): # noun is mapped
                        tokenCandidate = strongs[str(strongsCandidateID)]

                        if (contains(tokenCandidate, article, mustMatchWholeWord=True)):
                            # embedded article
                            # | the world |
                            working_tokens[scriptureIndex]['token'] = strongsCandidateID
                            continue

                        tokenCandidate = strongs[str(int(strongsCandidateID) - 1)]
                        if (synonymous(tokenCandidate, article, matchTolerance=MatchStrictness.SYNONYMS)):
                            # explicit article
                            # | the | world |
                            working_tokens[scriptureIndex]['token'] = strongsCandidateID - 1
                            continue

                        if (allowImplicitArticles):
                            # implicit article
                            # | world |
                            working_tokens[scriptureIndex]['token'] = strongsCandidateID
                            continue

# REVERT ANOMALIES
def revertAnomalies(working_tokens, strongs):
    """
    Compare tokens with their neighbours, if one is drastically different, revert it.
    """
    for tokenIndex, scriptureToken in enumerate(working_tokens):

        token = scriptureToken.get('token')
        if (not token):
            continue

        deltas = []

        for i in range(1, 3):
            # check previous tokens
            if (tokenIndex - i > 0):
                previousToken = working_tokens[tokenIndex - i].get('token')
                if (previousToken):
                    deltas.append(abs(int(token) - int(previousToken)) - i)

            # check next tokens
            if (tokenIndex + i < len(working_tokens)):
                nextToken = working_tokens[tokenIndex + i].get('token')
                if (nextToken):
                    deltas.append(abs(int(token) - int(nextToken)) - i)

        if (deltas != []):
            delta = sum(deltas) / len(deltas) # TODO is this a good metric?
            if (delta > 6): # TODO is this a good threshold?
                working_tokens[tokenIndex]['token'] = None
    pass

# TODO: possible improvements
# - make use of some markers (wj tags, for instance) ?
# - make use of capitalisation ('Him' != 'him' see Matthew 9:9)

# - sc Lord = Yahweh

# some tokens need to map to multiple strongs (see John 3:5, for example)

# NEED TO LEMMATISE SYNONYMS!

def equals(scriptureToken, strongsToken):
    """
    Are the contents of the two tokens identical?
    """
    return simplifyToken(scriptureToken) == simplifyToken(strongsToken)

def contains(strongsToken, scriptureToken, mustMatchWholeWord=False): # this is imperfect
    """
    Is the contents of the scripture token contained within the strongs token?
    Can enforce that the match must be perfect (i.e. 'a' should not match 'and')
    """
    if (mustMatchWholeWord):
        strongsContainer = simplifyToken(strongsToken).split(' ')
    else:
        strongsContainer = simplifyToken(strongsToken)

    return simplifyToken(scriptureToken) in strongsContainer

def simplifyToken(token):
    """
    Get the stripped content of a token.
    """
    if isinstance(token, str):
        return token.lower().strip(IGNORED_CHARS)
    
    elif (token.get('content')): # scripture
        return token['content'].lower().strip(IGNORED_CHARS)
    
    elif (token.get('eng')): # strongs
        return token['eng'].lower().strip(IGNORED_CHARS)
    
    return None

def synonymous(scriptureToken, strongsToken, matchTolerance, exhaustive=False):
    """
    Are the contents of the two tokens synonymous?
    If so, return the shared synonym.
    """
    strongsWord = simplifyToken(strongsToken)
    synonyms = []

    if (matchTolerance == MatchStrictness.LEMMAS):
        if (lemmas := (list(lemonymous(scriptureToken, strongsWord)))):
            return lemmas
                    
    if (matchTolerance == MatchStrictness.SYNONYMS):
        synonymCandidates = thesaurus.get(strongsWord)
        if (synonymCandidates):
            for synonymList in synonymCandidates: # list of synonyms for the strongs word
                for synonym in synonymList:
                    if (equals(scriptureToken, synonym)):

                        if (not exhaustive):
                            return synonym
                        synonyms.append(synonym)
            
    if (synonyms):
        return synonyms
    return False

def lemonymous(scriptureToken, strongsToken):
    """
    Do the two tokens share a lemma?
    If so, return the shared lemmas.
    """
    return (lemmatiseWord(simplifyToken(scriptureToken)) & lemmatiseWord(simplifyToken(strongsToken)))

def tokenIsDirty(token):
    """
    Is the token of an exception type, or already tokenised?
    """
    return (token.get('type') in ['note', 'it']) or (token.get('token') != None)

def lemmatiseWord(word, posTags=['v', 'n', 'a', 'r']):
    """
    Get the lemmas of a word.
    """
    global lemmaCache

    word = word.lower().strip(IGNORED_CHARS)

    if (lemma := lemmaCache.get(word)): # check cache
        return set(lemma)

    lemmatizer = WordNetLemmatizer()

    tempLemmas = set()

    for posTag in posTags:
        if (lemma := lemmatizer.lemmatize(word, posTag)) != word:
            tempLemmas.add(lemma)

    if (tempLemmas != []):
        lemmaCache[word] = tempLemmas
        return tempLemmas
    
    lemmaCache[word] = [word]
    return set(word)

## GEN.1.1
# scripture = [ #NKJV
#     { "header": "The History of Creation", "type": "p", "content": "In the " },
#     { "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },
#     { "content": "beginning " },
#     { "type": "note", "content": "Gen. 2:4; (Ps. 8:3; 89:11; 90:2); Is. 44:24; Acts 17:24; Rom. 1:20; (Heb. 1:2; 11:3); Rev. 4:11" },
#     { "content": "God created the heavens and the earth. " }
# ]
# scripture = [ #ESV
#     { "header": "The Creation of the World", "type": "p", "content": " " },
#     { "content": "In the " },
#     { "type": "note", "content": "Job 38:4-7; Ps. 33:6; 136:5; Isa. 42:5; 45:18; John 1:1-3; Acts 14:15; 17:24; Col. 1:16, 17; Heb. 1:10; 11:3; Rev. 4:11" },
#     { "content": "beginning, God created the heavens and the earth. " }
# ]
# strongs = { 
#     "0": { "strongs": "7225", "eng": "In the beginning" },
#     "1": { "strongs": "1254", "eng": "created" },
#     "2": { "strongs": "430", "eng": "God" },
#     "3": { "strongs": "853", "eng": "-" },
#     "4": { "strongs": "8064", "eng": "the heavens" },
#     "5": { "strongs": "853", "eng": "and" },
#     "6": { "strongs": "776", "eng": "the earth" }
# }


# load thesaurus used for synonyms
with open(os.path.join(os.path.dirname(__file__), 'data', 'en_thesaurus.json'), 'r') as f:
    thesaurus = json.load(f)

if __name__ == "__main__":
    # tokenisePassage('GEN.1', 1, 'NKJV', visualise=True)
    # tokenisePassage('GEN.1', 1, 'ESV', visualise=True)
    # tokenisePassage('EST.8', 9, 'NKJV', visualise=True)
    # tokenisePassage('JHN.3', 16, 'NKJV', visualise=True)

    # tokenisePassage('GEN.1', 7, 'NKJV', visualise=True)

    for i in range(1, 31):
        tokenisePassage('GEN.1', i, 'NKJV', visualise=True)
        # TODO
        # 10 'collection'-->'gathering together' (broad synonym)
        # 11 'fruit' (non-unique collision)
        # 11, 12 'in itself'?
        # 14 'and' (incorrect assignment)
        # 15, 17 (broad synonym)
        # 18 'over'(non-unique collision), 'and' (incorrect assignment)
        # 20 'of' (non-unique collision)
        # 21 'kinds' (incomplete lemma)
        # 22 'and' (non-unique collision)
        # 24 'the' (incorrect assumption of noun), 'and' (non-unique collision)
        # 26 'and over' (non-unique collision)
        # 27 'in' (non-unique collision)
        # 28 'God' (non-unique collision), 'and'
        # 29
        # 30 'Also' (borked distance metric)?
