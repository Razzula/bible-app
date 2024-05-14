# pylint: disable=fixme, line-too-long, invalid-name, superfluous-parens, trailing-whitespace, arguments-differ, annotation-unchecked
"""Creating a mapping between Scripture, and the original Hebrew/Greek words ('tokens')."""
import json
import os
import re
from enum import Enum

from nltk import word_tokenize, pos_tag
from nltk.stem import WordNetLemmatizer

import token_vis

class MatchStrictness(Enum):
    """An enumeration of the strictness of the matching process."""
    IDENTICAL = 1
    LEMMAS = 2
    SYNONYMS = 3
    MORPHOLOGY = 'A'
    BACKUP_MORPHOLOGY = 'B'

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

    with open(os.path.join(os.path.dirname(__file__), 'data', translation, translation, passage), 'r', encoding='utf-8') as f:
        data = json.load(f)
    scripture = data[str(verse)]

    with open(os.path.join(os.path.dirname(__file__), 'data', 'strongs', f'{passage}.json'), 'r', encoding='utf-8') as f:
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

    # 1. PRE-PROCESS TOKENS
    # A. FIRST, BREAK DOWN THE SCRIPTURE INTO INDIVIDUAL TOKENS
    for chunk in scripture:

        if (chunk.get('type') == 'note'):
            tokens.append(chunk) # notes don't need tokenising, but are left in the array to preserve the order
            continue

        if (chunk.get('content') == ' '): # ignore whitespace
            pass

        tokenCandidates = chunk['content'].split(' ') # TODO: also split using '-' (in other splittings, too)
        for candidateTokenIndex, candidateToken in enumerate(tokenCandidates):
            if (candidateToken.strip() == ''):
                continue

            token = {}

            # reconstruct
            if (chunk.get('header') and candidateTokenIndex == 0): # this assumes there will never be a heading mid-verse
                token['header'] = chunk['header']

            if (chunk.get('type')):
                token['type'] = chunk['type'] # TODO: cannot split paragraphs into multiple (?)

            token['content'] = candidateToken

            tokens.append(token)
        pass
    pass

    # TODO: for some translations, the [x] words (it) in strongs should be de-bracketed (perhaps in the strip function?)

    # B. GENERATE POS TAGS FOR EACH TOKEN
    tokens = tagVersePOS(tokens)

    # C. COUNT NUMBER OF OCCURRENCES OF EACH TOKEN
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
        for lemma in lemmatiseWord(tokenContent, token.get('pos')):
            exisitngCount = lemmaCounts.get(lemma)
            if (exisitngCount):
                lemmaCounts[lemma] = (exisitngCount[0] + 1, exisitngCount[1])
            else:
                lemmaCounts[lemma] = (1, 0)

    for token in strongs.values():

        if (token.get('eng') == '-'):
            continue

        tokenContent = simplifyToken(token)
        for word in tokenContent.split(' '):

            # genuine content
            exisitngCount = tokenCounts.get(word)
            if (exisitngCount):
                tokenCounts[word] = (exisitngCount[0], exisitngCount[1] + 1)
            else:
                tokenCounts[word] = (0, 1)

            # lemmas
            for lemma in lemmatiseWord(word, token.get('grammar', []), True):
                exisitngCount = lemmaCounts.get(lemma)
                if (exisitngCount):
                    lemmaCounts[lemma] = (exisitngCount[0], exisitngCount[1] + 1)
                else:
                    lemmaCounts[lemma] = (0, 1)

    # D. ABSTRACT THE TOKENS
    # we create a new object that is easier to work with, by removing some elements (notes, etc.)
    # and is also now mutable
    # note: the actual tokenisation occurs within this method
    ABSTRACT_TOKENS = tokeniseAbstract(tokens, strongs, tokenCounts, lemmaCounts)
    # apply result of tokenisation to the original tokens
    for token in ABSTRACT_TOKENS:
        if ((tokenID := token.get('token', None)) is not None):
            tokens[token['index']]['token'] = tokenID

    # CHECK STATUS
    for token in tokens:
        if (tokenIsDirty(token)):
            continue
        pass # FAILURE
        print(token.get('content'))

    if (visualise):
        window = token_vis.Window()
        window.draw(strongs, tokens, title=usfm) # this is blocking

    # RECONSTRUCT TOKENS
    # we originally tokenised the scripture into individual words, whereas the target tokens may be larger chunks,
    # it may be possible to reconstruct the scripture into some larger tokens, which would reduce the number of individual tokens
    newToken = {}
    finalTokens = []
    currentToken = -1 # cannot use 'None', as notes will have this token

    for token in tokens:

        newTokenID = token.get('token')

        if (currentToken != newTokenID): # new token
            if (newToken):
                finalTokens.append(newToken)

            newToken = token
            currentToken = newTokenID
        else: # same token as previous
            if (token.get('type') == newToken.get('type')):
                newToken['content'] += f' {token["content"]}' # TODO: this may not be ideal

    if (newToken != {}): # append last token
        finalTokens.append(newToken)
    pass

    return finalTokens

def tokeniseAbstract(TRUE_TOKENS, strongs, tokenCounts, lemmaCounts):
    """
    Tokenise a passage of scripture, using a strongs dictionary.
    This function uses an 'abstracted' version of the tokens, which is more suitable for matching.
    """

    # abstract tokens
    workingTokens = []
    for tokenIndex, token in enumerate(TRUE_TOKENS):
        if (not tokenIsDirty(token)):
            new_token = token.copy()
            new_token['index'] = tokenIndex
            workingTokens.append(new_token)

    # DO TWO SWEEPS: FIRST ENOFORCING POS MATCHING, THEN RELAXING IT
    for posStrictness in [MatchStrictness.MORPHOLOGY, MatchStrictness.BACKUP_MORPHOLOGY, None]:

        # DO THREE SWEEPS: FIRST USING LITERAL COMPARISON, THEN EXPANDING ACCEPTANCE CRITERIA TO INCLUDE LEMMAS, AND THEN SYNONYMS
        for matchTolerance in [MatchStrictness.IDENTICAL, MatchStrictness.LEMMAS, MatchStrictness.SYNONYMS]:
            pass

            # LINK ANY WHOLE, EXACT, UNIQUE MATCHES
            for strongsTokenID, strongsToken in strongs.items():

                if (strongsToken.get('eng') == '-'):
                    continue
                pass

                for scriptureIndex, scriptureToken in enumerate(workingTokens):

                    if (tokenIsDirty(scriptureToken)):
                        continue
                    if (not areTokenGrammarsEquivalent(scriptureToken, strongsToken, posStrictness)):
                        continue

                    if (matchTolerance == MatchStrictness.IDENTICAL):
                        if (tokenCounts.get(simplifyToken(scriptureToken)) == (1, 1)): # UNIQUE
                            if (equals(scriptureToken, strongsToken)): # WHOLE, EXACT
                                # update data to be tokenised
                                linkTokens(scriptureToken, scriptureIndex, strongsToken, strongsTokenID, workingTokens, posStrictness)
                                continue

                    else:
                        if (tokenCounts.get(simplifyToken(strongsToken))): # WHOLE
                            synonym = synonymous(scriptureToken, strongsToken, matchTolerance) # EXACT
                            if (synonym):

                                if (matchTolerance == MatchStrictness.LEMMAS): # TODO: this is kinda bad
                                    if (len(synonym) > 1):
                                        pass # will this ever occur? # YES: was -> wa, be
                                    for lemma in synonym:
                                        if (lemmaCounts[lemma] == (1, 1)): # UNIQUE
                                            # update data to be tokenised
                                            linkTokens(scriptureToken, scriptureIndex, strongsToken, strongsTokenID, workingTokens, posStrictness)
                                            continue

                                elif (matchTolerance == MatchStrictness.SYNONYMS):
                                    # TODO: better ensure uniqueness
                                    if (tokenCounts[synonym][0] == 1 and tokenCounts[simplifyToken(strongsToken)][1] == 1): # UNIQUE
                                        # update data to be tokenised
                                        linkTokens(scriptureToken, scriptureIndex, strongsToken, strongsTokenID, workingTokens, posStrictness)
                                        continue
            pass

            # LINK UNIQUE, INCOMPLETE MATCHES
            for strongsTokenID, strongsToken in strongs.items():

                if (strongsToken.get('eng') == '-'):
                    continue
                pass

                for scriptureIndex, scriptureToken in enumerate(workingTokens):

                    if (tokenIsDirty(scriptureToken)):
                        continue
                    if (not areTokenGrammarsEquivalent(scriptureToken, strongsToken, posStrictness)):
                        continue

                    if (matchTolerance == MatchStrictness.IDENTICAL):
                        if (tokenCounts.get(simplifyToken(scriptureToken)) == (1, 1)): # UNIQUE
                            if (contains(strongsToken, scriptureToken, mustMatchWholeWord=True)):
                                # update data to be tokenised
                                linkTokens(scriptureToken, scriptureIndex, strongsToken, strongsTokenID, workingTokens, posStrictness)
                                continue

                    elif (matchTolerance == MatchStrictness.LEMMAS):
                        pass # TODO: GEN.21

                    elif (matchTolerance == MatchStrictness.SYNONYMS):
                        for subword in simplifyToken(strongsToken).split(' '): # INCOMPLETE

                            count = tokenCounts.get(subword, (0, 0))[0]
                            if (synonymLists := thesaurus.get(subword)):
                                for synonymList in synonymLists:
                                    # TODO: if multiple lists contain the same word, this will be counted twice

                                    for synonym in synonymList:
                                        if ((tokenCount := tokenCounts.get(synonym, (0,0))[0]) > 0):
                                            count += tokenCount

                                if (count == 1): # UNIQUE
                                    synonym = synonymous(scriptureToken, subword, matchTolerance)
                                    if (synonym):
                                        # update data to be tokenised
                                        linkTokens(scriptureToken, scriptureIndex, strongsToken, strongsTokenID, workingTokens, posStrictness)
                                        continue

                                elif (count > 1):
                                    pass
                                    # this isn't great in terms of efficiency
                                    # as we are iterating over each synonym candidate twice
                                    # once here, for uniqueness, and then within the synonym function
                                    # TODO: do the uniqueness check within the synonym function
            pass

            # # BRIDGE GAPS # note: this is problematic
            # currentToken = None
            # chasm = []
            # for scriptureIndex, scriptureToken in enumerate(working_tokens):

            #     if (scriptureToken.get('type') == 'note'):
            #         continue

            #     scriptureTokenID = scriptureToken.get('token')
            #     if (scriptureTokenID is not None):
            #         if (currentToken != scriptureTokenID): # TODO: does this work?
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
            linkArticles(workingTokens, strongs)
            pass

            # REVERT ANOMALIES
            revertAnomalies(workingTokens)
            pass
        pass

        # HANDLE NON-UNIQUE TOKENS
        # if a token is not unique, it may be possible to infer its true token from its positioning
        # TODO: do a first sweep, ignoring articles, then do a final sweep without exemption
        for matchTolerance in [MatchStrictness.IDENTICAL, MatchStrictness.LEMMAS, MatchStrictness.SYNONYMS]:

            # get matches
            candidates = {}
            for tokenIndex, scriptureToken in enumerate(workingTokens):
                if (tokenIsDirty(scriptureToken)):
                    continue
                if ((posStrictness is not None) and ('DT' in scriptureToken['pos'])): # skip articles
                    continue

                # TODO: could we do a uniqueness check initally to prevent re-treading all the time?
                tempCandidates = []

                for strongsTokenID, strongsToken in strongs.items():
                    if (strongsToken.get('eng') == '-'):
                        continue
                    if (not areTokenGrammarsEquivalent(scriptureToken, strongsToken, posStrictness)):
                        continue
                    pass

                    for word in strongsToken['eng'].split(' '):
                        # if scriptureToken matches strongsToken, mark it as a candidate
                        if (matchTolerance == MatchStrictness.IDENTICAL):
                            if (equals(scriptureToken, word)):
                                tempCandidates.append(int(strongsTokenID))
                                break

                        elif (matchTolerance == MatchStrictness.LEMMAS):
                            if (lemonymous(scriptureToken, strongsToken)):
                                tempCandidates.append(int(strongsTokenID))
                                break

                        elif (matchTolerance == MatchStrictness.SYNONYMS):
                            synonyms = synonymous(scriptureToken, word, matchTolerance, exhaustive=True)
                            if (synonyms):
                                tempCandidates.append(int(strongsTokenID))
                                break

                if (tempCandidates):
                    candidates[tokenIndex] = tempCandidates

            # LINK CLOSEST MATCHES
            for tokenIndex, canidateTokens in candidates.items():
                scriptureTokenPos = tokenIndex / len(workingTokens)
                bestCandidateToken: list[int] = None # [tokenID, delta]
                # TODO: this is currrently first-come-first-serve, but it should be the truly closest

                for candidateToken in canidateTokens:

                    # evaluate candidates, using distance metric
                    candidateTokenPos = int(candidateToken) / len(strongs)
                    delta = abs(scriptureTokenPos - candidateTokenPos)

                    if (bestCandidateToken is None or delta < bestCandidateToken[1]):
                        workingTokensMatchingThisCandidate = [token for token in workingTokens if token.get('token') == candidateToken]
                        if (len(workingTokensMatchingThisCandidate) > 0): # this Strongs token is already in use
                            # check if any of these token are 'in competition' with this one
                            # TODO if so, we need to determine which one is the best candidate
                            if any([equals(workingTokens[tokenIndex], token) for token in workingTokensMatchingThisCandidate]):
                                continue
                        bestCandidateToken = (candidateToken, delta)

                # TODO: uniqueness check
                if (bestCandidateToken):
                    linkTokens(None, tokenIndex, None, bestCandidateToken[0], workingTokens, False)
            pass

            # REVERT AGAIN
            revertAnomalies(workingTokens)
            pass

        # LINK ARTICLES
        linkArticles(workingTokens, strongs, allowImplicitArticles=True)
        pass

        # ABSORB LOOSE TOKENS # TODO

        # SPECIAL CASES
        # truly|truly --> 'most assuredly',
        if (tokenCounts.get('truly', (0, 0))[1] >= 2): # 'truly truly' is viable in strongs

            for strongsTokenID, strongsToken in strongs.items():

                if (strongsToken['strongs']['data'] == 'G281'): # [Greek 281]: 'truly' # TODO: this is fragile to changes in the strongs dictionary
                    nextStrongsTokenID = str(int(strongsTokenID) + 1)
                    if (strongs[nextStrongsTokenID]['strongs']['data'] == 'G281'):
                        # truly|truly is present

                        for scriptureIndex, scriptureToken in enumerate(workingTokens):
                            if (tokenIsDirty(scriptureToken)):
                                continue

                            if (scriptureIndex < len(workingTokens) - 1):

                                for translation in [('most', 'assuredly'), ('verily', 'verily'), ('amen', 'amen')]:
                                    if (equals(scriptureToken, translation[0])):
                                        if (equals(workingTokens[scriptureIndex + 1], translation[1])):
                                            linkTokens(None, scriptureIndex, None, strongsTokenID, workingTokens, False)
                                            linkTokens(None, scriptureIndex + 1, None, nextStrongsTokenID, workingTokens, False)
                                            break
        pass

        # (GREEK) 'the' --> 'he'/'his' # TODO: (she/hers? they/theirs?)
        # TODO

        # x-less <--> without x
        for scriptureIndex, scriptureToken in enumerate(workingTokens):
            if (tokenIsDirty(scriptureToken)):
                continue

            # x-less
            match = re.match(r'(\w+)less', simplifyToken(scriptureToken))
            if (match):
                x = match.group(1)

                for strongsTokenID, strongsToken in strongs.items():
                    if (contains(strongsToken, x, mustMatchWholeWord=True)): # TODO: mustMatchWholeWord?
                        linkTokens(None, scriptureIndex, None, strongsTokenID, workingTokens, False)
                        break

            # without x
            elif (scriptureIndex < len(workingTokens) - 1):
                if (equals(scriptureToken, 'without')):
                    x = simplifyToken(workingTokens[scriptureIndex + 1])

                    for strongsTokenID, strongsToken in strongs.items():
                        if (contains(strongsToken, f'{x}less', mustMatchWholeWord=True)):
                            # match
                            linkTokens(None, scriptureIndex, None, strongsTokenID, workingTokens, False)
                            linkTokens(None, scriptureIndex + 1, None, strongsTokenID, workingTokens, False)
        pass

        # only allow the process to repeat (with relaxed rules) if there are still tokens to be tokenised
        if (not any(token.get('token') is None for token in workingTokens)):
            break
    pass

    return workingTokens

# LINK ARTICLES
def linkArticles(workingTokens, strongs, allowImplicitArticles=False):
    """
    Map articles based off of existing mappings of their respective nouns.
    Accepts both embedded and non-embedded articles.
    """
    for scriptureIndex, scriptureToken in enumerate(workingTokens):

        if (tokenIsDirty(scriptureToken)):
            continue

        if (bool(set(scriptureToken['pos']) & set(['DT', 'IN']))): # the, of
            # TODO: using all articles is not ideal, as it may lead to false positives
            if (len(workingTokens) > scriptureIndex + 1): # this should always be true, really
                # TODO instead of this, keep iterating until we hit a noun

                strongsCandidateID = workingTokens[scriptureIndex + 1].get('token')
                if (strongsCandidateID): # noun is mapped
                    tokenCandidate = strongs[str(strongsCandidateID)]

                    if (contains(tokenCandidate, scriptureToken['content'], mustMatchWholeWord=True)): # is capitalisation an issue here?
                        # embedded article
                        # | the world |
                        linkTokens(None, scriptureIndex, None, strongsCandidateID, workingTokens, False)
                        continue

                    if (not any(entry['pos'] == 'noun' for entry in tokenCandidate['grammar'])):
                        # TODO: (BIBLE-115) this whole function can be turned from geometric to syntactic
                        continue

                    tokenCandidate = strongs[str(int(strongsCandidateID) - 1)]
                    if (synonymous(tokenCandidate, scriptureToken['content'], matchTolerance=MatchStrictness.SYNONYMS)):
                        # explicit article
                        # | the | world |
                        linkTokens(None, scriptureIndex, None, int(strongsCandidateID) - 1, workingTokens, False)
                        continue

                    if (allowImplicitArticles):
                        # implicit article
                        # | world |
                        linkTokens(None, scriptureIndex, None, strongsCandidateID, workingTokens, False)
                        continue

# REVERT ANOMALIES
def revertAnomalies(workingTokens):
    """
    Compare tokens with their neighbours, if one is drastically different, revert it.
    """
    for tokenIndex, scriptureToken in enumerate(workingTokens):

        token = scriptureToken.get('token')
        if (not token):
            continue

        deltas = []

        for i in range(1, 3):
            # check previous tokens
            if (tokenIndex - i > 0):
                previousToken = workingTokens[tokenIndex - i].get('token')
                if (previousToken):
                    deltas.append(abs(int(token) - int(previousToken)) - i)

            # check next tokens
            if (tokenIndex + i < len(workingTokens)):
                nextToken = workingTokens[tokenIndex + i].get('token')
                if (nextToken):
                    deltas.append(abs(int(token) - int(nextToken)) - i)

        if (deltas):
            delta = sum(deltas) / len(deltas) # TODO: is this a good metric?
            if (delta > 6): # TODO: is this a good threshold?
                workingTokens[tokenIndex]['token'] = None
    pass

# TODO: possible improvements
# - make use of some markers (wj tags, for instance) ?
# - make use of capitalisation ('Him' != 'him' see Matthew 9:9)

# - sc Lord = Yahweh

# some tokens need to map to multiple strongs (see John 3:5, for example)

# NEED TO LEMMATISE SYNONYMS!

def linkTokens(scriptureToken, scriptureTokenIndex, strongsToken, strongsTokenID, workingTokens, enforcePOS=True):
    """
    Link a scripture token to a strongs token.
    """
    # enforce that the POS tags match, if specified
    if (enforcePOS):
        if (not areTokenGrammarsEquivalent(scriptureToken, strongsToken)):
            return False

    # TODO: enforce that a boundary is not crossed

    if (not scriptureToken):
        scriptureToken = workingTokens[scriptureTokenIndex]
    scriptureToken['token'] = strongsTokenID
    workingTokens[scriptureTokenIndex] = scriptureToken

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

    if (token.get('content')): # scripture
        return token['content'].lower().strip(IGNORED_CHARS)

    if (token.get('eng')): # strongs
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
        if (lemmas := (list(lemonymous(scriptureToken, strongsToken)))):
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
    return (
        lemmatiseWord(simplifyToken(scriptureToken), scriptureToken.get('pos'))
        & lemmatiseWord(simplifyToken(strongsToken), strongsToken.get('grammar', []), True)
    )

def tokenIsDirty(token):
    """
    Is the token of an exception type, or already tokenised?
    """
    return (token.get('type') in ['note', 'it']) or (token.get('token') is not None)

def tagVersePOS(tokens, englishTag='content'):
    """
    Tag the part-of-speech of each token.
    """
    # tag POS using whole verse context
    verse = ' '.join([token[englishTag] for token in tokens if token.get('type') != 'note'])

    taggedVerse = pos_tag(word_tokenize(verse)) # Penn Treebank POS tags

    # transfer POS tags to tokens
    taggedWords = iter(taggedVerse)
    currentTaggedWord = next(taggedWords, None)

    for token in tokens:
        if (token.get('type') == 'note'):
            continue

        token['pos'] = []
        tokenText = token[englishTag]

        while (currentTaggedWord):
            if (tokenText.startswith(currentTaggedWord[0])):
                token['pos'].append(currentTaggedWord[1])
                tokenText = tokenText[len(currentTaggedWord[0]):]

                if (tokenText == ''): # move to next token
                    currentTaggedWord = next(taggedWords, None)
                    break
            else:
                if (currentTaggedWord[0].startswith(' ')):
                    raise ValueError(f"Failed to match '{tokenText}' with '{currentTaggedWord[0]}'")
                currentTaggedWord = (f' {currentTaggedWord[0]}', currentTaggedWord[1]) # add space, in case this was the issue.
                continue # try again
            currentTaggedWord = next(taggedWords, None)

    return tokens

def tagStrongsPOS(tokens):
    """
    Tag the part-of-speech of each token.
    """
    taggedTokens = tagVersePOS(tokens.values(), 'eng')
    rebuiltTokens = {}
    for index, token in enumerate(taggedTokens):
        rebuiltTokens[str(index + 1)] = token
    return rebuiltTokens

def getWordnetPOS(inputTag, isStrongsTag=False):
    """
    Convert either a Penn Treebank POS tag, or a Strongs morphology tag, to a WordNet POS tag.
    """
    if (inputTag is None):
        return None

    outputTags = set()

    if (isStrongsTag):
        switcher = {
            'adjective': 'a',  # adjective
            'verb': 'v',  # verb
            'noun': 'n', 'pronoun': 'n', # noun
            'adverb': 'r',  # adverb
        }
        for tag in inputTag:
            if (posTag := switcher.get(tag['pos'], None)):
                outputTags.add(posTag)
        return list(outputTags) if (len(outputTags) > 0) else None
    else:
        switcher = {
            'J': 'a',  # adjective
            'V': 'v',  # verb
            'N': 'n',  # noun
            'R': 'r',  # adverb
        }
        for tag in inputTag:
            if (posTag := switcher.get(tag[0], None)):
                outputTags.add(posTag)
        return list(outputTags) if (len(outputTags) > 0) else None

def areTokenGrammarsEquivalent(scriptureToken, strongsToken, strictness):
    """
    Determine if the grammar tags of the two tokens are equivalent.

    Args:
    scriptureToken (dict): Token with Penn Treebank POS tags.
    strongsToken (dict): Token with Hebrew Parsing Tag system tags.

    Returns:
    bool: True if any Hebrew tag matches the Penn Treebank tag for the token, False otherwise.
    """
    if (strictness is None):
        return True
    if (strictness == MatchStrictness.BACKUP_MORPHOLOGY):
        return bool(set(scriptureToken['pos']) & set(strongsToken['pos']))

    # a strongs token may have multiple grammar tags
    for scriptureTokenPOS in scriptureToken.get('pos', []):
        for strongTokenTags in strongsToken.get('grammar', []):
            strongTokenPOS = strongTokenTags['pos'] # (Hebrew Parsing Tag)
            match strongTokenPOS:
                case 'conjunctive waw':
                    if (scriptureTokenPOS in [
                        'CC',
                        'IN', # so = and
                    ]):
                        return True
                case 'conjunction':
                    if (scriptureTokenPOS in [
                        'CC',
                        'IN', # so = and
                    ]):
                        return True
                case 'number':
                    if (scriptureTokenPOS == 'CD'):
                        return True
                case 'article':
                    if (scriptureTokenPOS == 'DT'):
                        return True
                case 'preposition':
                    if (scriptureTokenPOS in ['IN', 'TO']):
                        return True
                case 'adjective':
                    if (scriptureTokenPOS in ['JJ', 'JJR', 'JJS']):
                        return True
                case 'noun':
                    if (scriptureTokenPOS in [
                            'NN', 'NNS', 'NNP', 'NNPS',
                            'DT', 'IN', 'TO', # as we are dealing with Hebrew, sometimes these are tagged as nouns
                        ]):
                        # it is best to ignore both plural and proper tags, as these differ between English and Hebrew
                        # for example, 'God' is a single, proper noun, but 'elohim' is a plural, common noun
                        return True
                case 'pronoun':
                    if (scriptureTokenPOS in ['PRP', 'PRP$', 'WP', 'WP$']):
                        return True
                case 'adverb':
                    if (scriptureTokenPOS in ['RB', 'RBR', 'RBS', 'EX']):
                        return True
                case 'interjection':
                    if (scriptureTokenPOS == 'UH'):
                        return True
                case 'verb':
                    if (scriptureTokenPOS in ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ', 'MD']):
                        return True
                case 'interrogative':
                    if (scriptureTokenPOS in ['WDT', 'WP', 'WP$', 'WRB']):
                        return True
                case _:
                    if (strongTokenPOS not in ['direct object marker']
                        and not strongTokenPOS.startswith('third person')
                        and not strongTokenPOS.startswith('first person')
                        and not strongTokenPOS.startswith('second person')
                    ): # we ignore these
                        pass
    return False

def lemmatiseWord(words, posTags, isStrongsTag=False):
    """
    Get the lemmas of a word.
    """
    lemmas = set()
    if (posTags := getWordnetPOS(posTags, isStrongsTag)):

        words = words.split(' ')
        for word in words:
            word = word.lower().strip(IGNORED_CHARS)

            if ((lemma := lemmaCache.get(word, None)) is not None): # check cache
                lemmas |= lemma
                continue

            lemmatizer = WordNetLemmatizer()
            tempLemmas = set()

            if (isinstance(posTags, str)):
                posTags = [posTags]

            for posTag in posTags:
                if (lemma := lemmatizer.lemmatize(word, posTag)) != word:
                    tempLemmas.add(lemma)

            if (tempLemmas):
                lemmaCache[word] = tempLemmas
                lemmas |= tempLemmas
                continue

            lemmaCache[word] = None
    return lemmas

## GEN.1.1
# scripture = [ # NKJV
#     { "header": "The History of Creation", "type": "p", "content": "In the " },
#     { "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },
#     { "content": "beginning " },
#     { "type": "note", "content": "Gen. 2:4; (Ps. 8:3; 89:11; 90:2); Is. 44:24; Acts 17:24; Rom. 1:20; (Heb. 1:2; 11:3); Rev. 4:11" },
#     { "content": "God created the heavens and the earth. " }
# ]
# scripture = [ # ESV
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
with open(os.path.join(os.path.dirname(__file__), 'data', 'en_thesaurus.json'), 'r', encoding='utf-8') as thesaurusFile:
    thesaurus = json.load(thesaurusFile)

if __name__ == "__main__":
    # tokenisePassage('GEN.1', 1, 'NKJV', visualise=True)
    # tokenisePassage('GEN.1', 1, 'ESV', visualise=True)
    # tokenisePassage('EST.8', 9, 'NKJV', visualise=True)
    # tokenisePassage('JHN.3', 16, 'NKJV', visualise=True)

    # tokenisePassage('GEN.1', 7, 'NKJV', visualise=True)

    for temp in range(1, 32):
        tokenisePassage('GEN.1', temp, 'NKJV', visualise=True)
        # TODO
        # 5: so, the

        # 11, 12 'in itself'?
        # 14 'and' (incorrect assignment)
        # 15, 17 (broad synonym) 'give light'
        # 18 'and' (incorrect assignment)
        # 21 'kinds' (incomplete lemma)
        # 24 'the' (incorrect assumption of noun)
        # 28 'and'
        # 29
        # 30 'Also' (borked distance metric)?

        # non-unique collision : 11 (fruit), 18 (over), 20 (of), 22 (and), 24 (and), 26 (and over), 27 (in), 28 (God)
