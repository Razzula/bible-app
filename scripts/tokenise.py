import json
import os
from nltk.stem import WordNetLemmatizer
from enum import Enum

import token_vis

class MatchStrictness(Enum):
    IDENTICAL = 1
    LEMMAS = 2
    SYNONYMS = 3

IGNORED_CHARS = ''.join(['.', ',', ';', ':', '?', '!', '“', '”', '‘', '’'])

lemmaCache = {}

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

        if (chunk.get('content') == ' '):
            pass

        tokenCandidates = chunk['content'].split(' ')
        for candidateTokenIndex, candidateToken in enumerate(tokenCandidates):
            if (candidateToken.strip() == ''):
                continue

            token = {}

            # reconstruct
            if (chunk.get('header') and candidateTokenIndex == 0): # this assumes there will never be a heading mid-verse
                token['header'] = chunk['header']

            if (chunk.get('type')):
                token['type'] = chunk['type'] # TODO cannot split paragraphs into multiple

            token['content'] = candidateToken

            tokens.append(token)
        pass
    pass

    # COUNT NUMBER OF OCCURRENCES OF EACH TOKEN
    tokenCounts = {} # { token: (scriptureCount, strongsCount) }
    lemmaCounts = {}

    for token in tokens:
        # skip notes
        if (token.get('type') == 'note'):
            continue

        tokenContent = token['content'].lower().strip('.,;:?!')

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
                                if (tokenCounts[synonym][0] == 1 and tokenCounts[simplifyToken(strongsToken)][1] == 1): # UNIQUE
                                    # update data to be tokenised
                                    scriptureToken['token'] = strongsTokenID
                                    working_tokens[scriptureIndex] = scriptureToken
                                    continue
        pass

        # LINK DETERMINERS
        for strongsTokenID, strongsToken in strongs.items():
            # we are assuming that the token `the` and `[object]` are always subsequent
            # is this safe?

            if (simplifyToken(strongsToken) == 'the'): # TODO expand

                # find token that matches the next strongs token
                # e.g. in ['the', 'world'], find 'world'
                for scriptureIndex, scriptureToken in enumerate(working_tokens):

                    if (scriptureToken.get('token') == str(int(strongsTokenID) + 1)): # assumption (see above)
                        # find the corresponding determiner
                        i = 0
                        while (scriptureIndex - i > 1):
                            i += 1
                            previousToken = working_tokens[scriptureIndex - i]
                            if (previousToken.get('type') == 'note'): # skip notes
                                continue
                            if (previousToken.get('token')): # don't overwrite existing tokens
                                break

                            if (equals(previousToken, strongsToken)):
                                working_tokens[scriptureIndex - i]['token'] = strongsTokenID
                            break
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
                    pass # TODO

                elif (matchTolerance == MatchStrictness.SYNONYMS):
                    for subword in simplifyToken(strongsToken).split(' '): # INCOMPLETE
                        synonym = synonymous(scriptureToken, subword, matchTolerance)
                        if (synonym):
                            if (tokenCounts[synonym][0] == 1 and tokenCounts[subword][1] == 1): # UNIQUE
                                # update data to be tokenised
                                scriptureToken['token'] = strongsTokenID
                                working_tokens[scriptureIndex] = scriptureToken
                                continue
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

        # LINK EMBEDDED DETERMINERS #TODO this could be applied after non-unique tokens, too
        for scriptureIndex, scriptureToken in enumerate(working_tokens):

            if (tokenIsDirty(scriptureToken)):
                continue

            if (simplifyToken(scriptureToken) == 'the'): # TODO expand
                if (len(working_tokens) > scriptureIndex + 1):
                    tokenCandidateID = working_tokens[scriptureIndex + 1].get('token')
                    if (tokenCandidateID):
                        working_tokens[scriptureIndex]['token'] = tokenCandidateID
        pass

        # REVERT ANOMALIES
        # compare tokens with their neighbours, if one is drastically different, revert it
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
                delta = sum(deltas) / len(deltas)
                if (delta > 6): # TODO is this a good threshold?
                    working_tokens[tokenIndex]['token'] = None
        pass
    pass

    # HANDLE NON-UNIQUE TOKENS
    # if a token is not unique, it may be possible to infer its true token from its positioning
    for matchTolerance in [MatchStrictness.IDENTICAL, MatchStrictness.LEMMAS, MatchStrictness.SYNONYMS]:
        
        # get matches
        candidates = {}
        for tokenIndex, scriptureToken in enumerate(working_tokens):
            if (tokenIsDirty(scriptureToken)):
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
                        if (lemmatiseWord(scriptureToken.get('content')) & lemmatiseWord(word)):
                            tempCandidates.append(int(strongsTokenID))
                    
                    elif (matchTolerance == MatchStrictness.SYNONYMS):
                        synonym = synonymous(scriptureToken, word, matchTolerance)
                        if (synonym):
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
        # TODO

    # ABSORB LOOSE TOKENS # TODO
        # ARE ANY TRUE TOKENS NOT USED?
    
        # IF TEXT IS GREEK, ALLOW 'the' TO BE 'he'/'his'
    pass

    return working_tokens

    # TODO: possible improvements
    # - make use of some markers (wj tags, for instance) ?
    # - make use of capitalisation ('Him' != 'him' see Matthew 9:9)
    # - use a better distance metric (exclude tags, '-', etc. instead of using indexes)

    # - sc Lord = Yahweh
    # - truly | truly --> most assuredly
    # - xless --> without x

    # NEED TO LEMMATISE SYNONYMS!

    # ADDITIONAL SYNONYMS
    # - 'delivered' --> 'gave'
    # - 'grant' --> 'give'

    # ADDITIONAL LEMMAS
    # - 'spared' --> 'spare'

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

def synonymous(scriptureToken, strongsToken, matchTolerance):
    """
    Are the contents of the two tokens synonymous?
    If so, return the shared synonym.
    """
    strongsWord = simplifyToken(strongsToken)

    if (matchTolerance == MatchStrictness.LEMMAS):
        if (lemmas := (list(lemmatiseWord(simplifyToken(scriptureToken)) & lemmatiseWord(strongsWord)))):
            return lemmas
                    
    if (matchTolerance == MatchStrictness.SYNONYMS):
        synonyms = thesaurus.get(strongsWord)
        if (synonyms):
            for synonymList in synonyms: # list of synonyms for the strongs word
                for synonym in synonymList:
                    if (equals(scriptureToken, synonym)):
                        return synonym
                    
    return False

def tokenIsDirty(token):
    """
    Is the token of an exception type, or already tokenised?
    """
    return (token.get('type') in ['note', 'it']) or (token.get('token') != None)
        # TODO use an array for more cases instead of just 'note'

def lemmatiseWord(word, posTags=['v', 'n', 'a', 'r']):
    """
    Get the lemmas of a word.
    """
    global lemmaCache

    word = word.lower().strip(IGNORED_CHARS)

    if (lemma := lemmaCache.get(word)): # check cache
        return lemma

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

    tokenisePassage('ROM.3', 23, 'NKJV', visualise=True)
