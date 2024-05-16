# pylint: disable=fixme, line-too-long, invalid-name, superfluous-parens, trailing-whitespace, arguments-differ, annotation-unchecked
"""Creating a mapping between Scripture, and the original Hebrew/Greek words ('tokens')."""
import json
import os
import re
from enum import Enum
from typing import Any, Callable

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

class Tokeniser:
    """A class for tokenising a passage of scripture."""

    LEMMA_CACHE = {
        'spared': set(['spare']),
        # 'kinds': set(['kind']),
        # 'kind': set(['kind']),
    }

    def __init__(self):
        pass

    def tokenisePassage(self, passage, verse, translation, visualise=False):
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
            tokenisationJob = self.TokenisationJob(translation, self.lemmatiseWord, self.lemonymous, self.synonymous)
            return tokenisationJob.tokenise(scripture, strongs, visualise=visualise, usfm=f'{passage}.{verse}')
        return None

    class TokenisationJob:
        """An individual job to tokenise a passage of scripture. This is declared as a subclass, to allow for functions to share data easily."""

        def __init__(self, translation, lemmatiseWord: Callable[[Any, Any, bool], (set | Any)], lemonymous, synonymous):
            self.lemmatiseWord = lemmatiseWord
            self.lemonymous = lemonymous
            self.synonymous = synonymous

            self.workingTokens: list = []
            self.strongs: dict = {}

            # SETTINGS
            # Reverent Capitalisation
            # in some translations, we can be strict with the capitalisation of some words: He != he (excluding begininng of sentences, wrth gwrs!)
            self.useReverentCapitalisation = (translation.upper() in ['NKJV'])

        def tokenise(self, scripture, strongs, visualise=False, usfm=None):
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
            strongs = tagStrongsPOS(strongs) # add 'backup' POS tags to strongs

            # C. COUNT NUMBER OF OCCURRENCES OF EACH TOKEN
            self.tokenCounts = {} # { token: (scriptureCount, strongsCount) }
            self.lemmaCounts = {}
            self.synonymCounts = {}

            for scriptureToken in tokens:
                # skip notes
                if (scriptureToken.get('type') == 'note'):
                    continue

                tokenContent = simplifyToken(scriptureToken)

                # genuine content
                if (exisitngCount := self.tokenCounts.get(tokenContent)):
                    self.tokenCounts[tokenContent] = (exisitngCount[0] + 1, exisitngCount[1])
                else:
                    self.tokenCounts[tokenContent] = (1, 0)

                # lemmas
                for lemma in self.lemmatiseWord(tokenContent, scriptureToken.get('pos')):
                    if (exisitngCount := self.lemmaCounts.get(lemma)):
                        self.lemmaCounts[lemma] = (exisitngCount[0] + 1, exisitngCount[1])
                    else:
                        self.lemmaCounts[lemma] = (1, 0)

                # synonyms
                for synonym in getSynonyms(tokenContent):
                    if (exisitngCount := self.synonymCounts.get(synonym)):
                        self.synonymCounts[synonym] = (exisitngCount[0] + 1, exisitngCount[1])
                    else:
                        self.synonymCounts[synonym] = (1, 0)

            for strongsToken in strongs.values():

                if (strongsToken.get('eng') == '-'):
                    continue

                tokenContent = simplifyToken(strongsToken)
                for word in tokenContent.split(' '):

                    # genuine content
                    if (exisitngCount := self.tokenCounts.get(word)):
                        self.tokenCounts[word] = (exisitngCount[0], exisitngCount[1] + 1)
                    else:
                        self.tokenCounts[word] = (0, 1)

                    # lemmas
                    for lemma in self.lemmatiseWord(word, strongsToken.get('grammar'), True):
                        if (exisitngCount := self.lemmaCounts.get(lemma)):
                            self.lemmaCounts[lemma] = (exisitngCount[0], exisitngCount[1] + 1)
                        else:
                            self.lemmaCounts[lemma] = (0, 1)

                    # synonyms
                    for synonym in getSynonyms(word):
                        if (exisitngCount := self.synonymCounts.get(synonym)):
                            self.synonymCounts[synonym] = (exisitngCount[0], exisitngCount[1] + 1)
                        else:
                            self.synonymCounts[synonym] = (0, 1)
            pass

            # D. ABSTRACT THE TOKENS
            # we create a new object that is easier to work with, by removing some elements (notes, etc.)
            # and is also now mutable
            # note: the actual tokenisation occurs within this method
            ABSTRACT_TOKENS = self.tokeniseAbstract(tokens, strongs)
            # apply result of tokenisation to the original tokens
            for abstractToken in ABSTRACT_TOKENS:
                if ((tokenID := abstractToken.get('token', None)) is not None):
                    tokens[abstractToken['index']]['token'] = tokenID

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

        def tokeniseAbstract(self, TRUE_TOKENS, strongs):
            """
            Tokenise a passage of scripture, using a strongs dictionary.
            This function uses an 'abstracted' version of the tokens, which is more suitable for matching.
            """
            self.workingTokens = []
            self.strongs = strongs.copy()

            # abstract tokens
            for tokenIndex, token in enumerate(TRUE_TOKENS):
                if (not tokenIsDirty(token)):
                    new_token = token.copy()
                    new_token['index'] = tokenIndex
                    self.workingTokens.append(new_token)

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

                        for scriptureIndex, scriptureToken in enumerate(self.workingTokens):

                            if (tokenIsDirty(scriptureToken)):
                                continue
                            if (not areTokenGrammarsEquivalent(scriptureToken, strongsToken, posStrictness)):
                                continue

                            if (matchTolerance == MatchStrictness.IDENTICAL):
                                if (self.tokenCounts.get(simplifyToken(scriptureToken)) == (1, 1)): # UNIQUE
                                    if (equals(scriptureToken, strongsToken)): # WHOLE, EXACT
                                        # update data to be tokenised
                                        self.linkTokens(scriptureIndex, strongsTokenID, posStrictness)
                                        continue

                            else:
                                if (self.tokenCounts.get(simplifyToken(strongsToken))): # WHOLE
                                    synonym = self.synonymous(scriptureToken, strongsToken, matchTolerance) # EXACT
                                    if (synonym):

                                        if (matchTolerance == MatchStrictness.LEMMAS): # TODO: this is kinda bad
                                            if (len(synonym) > 1):
                                                pass # will this ever occur? # YES: was -> wa, be
                                            for lemma in synonym:
                                                if (self.lemmaCounts[lemma] == (1, 1)): # UNIQUE
                                                    # update data to be tokenised
                                                    self.linkTokens(scriptureIndex, strongsTokenID, posStrictness)
                                                    continue

                                        elif (matchTolerance == MatchStrictness.SYNONYMS):
                                            if (self.synonymCounts[simplifyToken(scriptureToken)][0] == 1 and self.synonymCounts[simplifyToken(strongsToken)][1] == 1): # UNIQUE
                                                # update data to be tokenised
                                                self.linkTokens(scriptureIndex, strongsTokenID, posStrictness)
                                                continue
                    pass

                    # LINK UNIQUE, INCOMPLETE MATCHES
                    for strongsTokenID, strongsToken in strongs.items():

                        if (strongsToken.get('eng') == '-'):
                            continue
                        pass

                        for scriptureIndex, scriptureToken in enumerate(self.workingTokens):

                            if (tokenIsDirty(scriptureToken)):
                                continue
                            if (not areTokenGrammarsEquivalent(scriptureToken, strongsToken, posStrictness)):
                                continue

                            if (matchTolerance == MatchStrictness.IDENTICAL):
                                if (self.tokenCounts.get(simplifyToken(scriptureToken)) == (1, 1)): # UNIQUE
                                    if (contains(strongsToken, scriptureToken, mustMatchWholeWord=True)):
                                        # update data to be tokenised
                                        self.linkTokens(scriptureIndex, strongsTokenID, posStrictness, scriptureToken['content'])
                                        continue

                            elif (matchTolerance == MatchStrictness.LEMMAS):
                                pass # TODO: GEN.21

                            elif (matchTolerance == MatchStrictness.SYNONYMS):
                                for subword in simplifyToken(strongsToken).split(' '): # INCOMPLETE

                                    scriptureWord = simplifyToken(scriptureToken)
                                    scriptureCount = self.synonymCounts.get(scriptureWord, (0, 0))[0]
                                    strongCount = self.synonymCounts.get(subword, (0, 0))[1]

                                    if (scriptureCount == 1 and strongCount == 1): # UNIQUE
                                        synonym = self.synonymous(scriptureWord, subword, matchTolerance)
                                        if (synonym):
                                            # update data to be tokenised
                                            self.linkTokens(scriptureIndex, strongsTokenID, posStrictness, subword)
                                            break
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
                    self.linkArticles()
                    pass

                    # REVERT ANOMALIES
                    self.revertAnomalies()
                    pass
                pass

                # HANDLE NON-UNIQUE TOKENS
                # if a token is not unique, it may be possible to infer its true token from its positioning
                for matchTolerance in [MatchStrictness.IDENTICAL, MatchStrictness.LEMMAS, MatchStrictness.SYNONYMS]:

                    # get matches
                    candidates = {}
                    for tokenIndex, scriptureToken in enumerate(self.workingTokens):
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
                                    if (self.lemonymous(scriptureToken, strongsToken)):
                                        tempCandidates.append(int(strongsTokenID))
                                        break

                                elif (matchTolerance == MatchStrictness.SYNONYMS):
                                    synonyms = self.synonymous(scriptureToken, word, matchTolerance, exhaustive=True)
                                    if (synonyms):
                                        tempCandidates.append(int(strongsTokenID))
                                        break

                        if (tempCandidates):
                            scriptureTokenPos = tokenIndex / len(self.workingTokens)

                            for candidateToken in tempCandidates:
                                # evaluate candidates, using distance metric
                                candidateTokenPos = int(candidateToken) / len(strongs)
                                delta = str(abs(scriptureTokenPos - candidateTokenPos))

                                if (not candidates.get(delta)):
                                    candidates[delta] = { tokenIndex: [] }
                                elif (not candidates[delta].get(tokenIndex)):
                                    candidates[delta][tokenIndex] = []

                                candidates[delta][tokenIndex].append(candidateToken)
                    pass

                    # LINK CLOSEST MATCHES
                    # bipartite matching problem (greedy) # TODO: (BIBLE-118) Hungarian algorithm
                    exhaustedTokens = set()
                    for delta, tokenMaps in sorted(candidates.items()):

                        for scriptureIndex, strongIndexes in tokenMaps.items():
                            if (scriptureIndex not in exhaustedTokens): # this Scripture token has not been tokenised
                                for strongIndex in strongIndexes:
                                    strongsCandidate = strongs[str(strongIndex)]
                                    workingTokensMatchingThisCandidate = [token for token in self.workingTokens if token.get('token') == strongIndex]
                                    if (len(workingTokensMatchingThisCandidate) < len(strongsCandidate['eng'].split(' '))): # this Strongs token is already in use
                                        self.linkTokens(scriptureIndex, strongIndex, False)
                                        exhaustedTokens.add(scriptureIndex)
                                        break
                    pass

                    # REVERT AGAIN
                    self.revertAnomalies()
                    pass

                # LINK ARTICLES
                self.linkArticles(allowImplicitArticles=True)
                pass

                # ABSORB LOOSE TOKENS # TODO

                # SPECIAL CASES
                # truly|truly --> 'most assuredly',
                if (self.tokenCounts.get('truly', (0, 0))[1] >= 2): # 'truly truly' is viable in strongs

                    for strongsTokenID, strongsToken in strongs.items():

                        if (strongsToken['strongs']['data'] == 'G281'): # [Greek 281]: 'truly' # TODO: this is fragile to changes in the strongs dictionary
                            nextStrongsTokenID = str(int(strongsTokenID) + 1)
                            if (strongs[nextStrongsTokenID]['strongs']['data'] == 'G281'):
                                # truly|truly is present

                                for scriptureIndex, scriptureToken in enumerate(self.workingTokens):
                                    if (tokenIsDirty(scriptureToken)):
                                        continue

                                    if (scriptureIndex < len(self.workingTokens) - 1):

                                        for translation in [('most', 'assuredly'), ('verily', 'verily'), ('amen', 'amen')]:
                                            if (equals(scriptureToken, translation[0])):
                                                if (equals(self.workingTokens[scriptureIndex + 1], translation[1])):
                                                    self.linkTokens(scriptureIndex, strongsTokenID, False)
                                                    self.linkTokens(scriptureIndex + 1, nextStrongsTokenID, False)
                                                    break
                pass

                # (GREEK) 'the' --> 'he'/'his' # TODO: (she/hers? they/theirs?)
                # TODO

                # x-less <--> without x
                for scriptureIndex, scriptureToken in enumerate(self.workingTokens):
                    if (tokenIsDirty(scriptureToken)):
                        continue

                    # x-less
                    match = re.match(r'(\w+)less', simplifyToken(scriptureToken))
                    if (match):
                        x = match.group(1)

                        for strongsTokenID, strongsToken in strongs.items():
                            if (contains(strongsToken, x, mustMatchWholeWord=True)): # TODO: mustMatchWholeWord?
                                self.linkTokens(scriptureIndex, strongsTokenID, False)
                                break

                    # without x
                    elif (scriptureIndex < len(self.workingTokens) - 1):
                        if (equals(scriptureToken, 'without')):
                            x = simplifyToken(self.workingTokens[scriptureIndex + 1])

                            for strongsTokenID, strongsToken in strongs.items():
                                if (contains(strongsToken, f'{x}less', mustMatchWholeWord=True)):
                                    # match
                                    self.linkTokens(scriptureIndex, strongsTokenID, False)
                                    self.linkTokens(scriptureIndex + 1, strongsTokenID, False)
                pass

                # only allow the process to repeat (with relaxed rules) if there are still tokens to be tokenised
                if (not any(token.get('token') is None for token in self.workingTokens)):
                    break
            pass

            return self.workingTokens

        def linkTokens(self, scriptureTokenIndex, strongsTokenID, enforcePOS, strongWord=None):
            """
            Link a scripture token to a strongs token.
            """
            scriptureToken = self.workingTokens[scriptureTokenIndex]
            strongsToken = self.strongs[str(strongsTokenID)]
            # VALIDATION
            # enforce that the POS tags match, if specified
            if (enforcePOS):
                if (not areTokenGrammarsEquivalent(scriptureToken, strongsToken, enforcePOS)):
                    return False

            # TODO: enforce that a boundary is not crossed

            # LINK
            scriptureToken['token'] = str(strongsTokenID)
            self.workingTokens[scriptureTokenIndex] = scriptureToken

            # UPDATE BELIEFS
            # SCRIPTURE
            # word
            scriptureWord = simplifyToken(scriptureToken)
            self.tokenCounts[scriptureWord] = (self.tokenCounts[scriptureWord][0] - 1, self.tokenCounts[scriptureWord][1])
            # lemma
            for lemma in self.lemmatiseWord(scriptureWord, scriptureToken.get('pos')):
                self.lemmaCounts[lemma] = (self.lemmaCounts[lemma][0] - 1, self.lemmaCounts[lemma][1])
            # synonyms
            for synonym in getSynonyms(scriptureWord):
                self.synonymCounts[synonym] = (self.synonymCounts[synonym][0] - 1, self.synonymCounts[synonym][1])

            # STRONGS
            # we cannot change the strongs counts as this would damage the accuracy
            # 'in the beginning God created the heavens'
            # if we link the first 'the', we now count 'the' as unique, which means the first 'the' may also link a
            # second time, which would be incorrect

            # if (strongWord == -1): # flagged to skip the strongs token
            #     return
            # if (strongWord is None):
            #     strongWord = simplifyToken(strongsToken)
            #     if (' ' in strongWord):
            #         # we have no way of knowing which of this token's subwords were used, so cannot update our beliefs
            #         return
            # else:
            #     strongWord = simplifyToken(strongWord)

            # # word
            # self.tokenCounts[strongWord] = (self.tokenCounts[strongWord][0], self.tokenCounts[strongWord][1] - 1)
            # # lemma
            # for lemma in self.lemmatiseWord(strongWord, strongsToken.get('grammar'), True):
            #     self.lemmaCounts[lemma] = (self.lemmaCounts[lemma][0], self.lemmaCounts[lemma][1] - 1)
            # # synonyms
            # for synonym in getSynonyms(strongWord):
            #     self.synonymCounts[synonym] = (self.synonymCounts[synonym][0], self.synonymCounts[synonym][1] - 1)

        # LINK ARTICLES
        def linkArticles(self, allowImplicitArticles=False):
            """
            Map articles based off of existing mappings of their respective nouns.
            Accepts both embedded and non-embedded articles.
            """
            for scriptureIndex, scriptureToken in enumerate(self.workingTokens):

                if (tokenIsDirty(scriptureToken)):
                    continue
                if (len(self.workingTokens) <= scriptureIndex + 1):
                    break

                if (bool(set(scriptureToken['pos']) & set(['DT', 'IN']))): # the, of
                    # TODO: using all articles is not ideal, as it may lead to false positives
                    offset = 1
                    tokenCandidate = None
                    while (len(self.workingTokens) > scriptureIndex + offset): # this should always be true, really
                        nextToken = self.workingTokens[scriptureIndex + offset]
                        isNoun = bool(set(nextToken['pos']) & set(['NN', 'NNS', 'NNP', 'NNPS']))
                        isAdjective = bool(set(nextToken['pos']) & set(['JJ', 'JJR', 'JJS']))
                        if ((not isNoun) and (not isAdjective) or (not nextToken.get('token'))):
                            break
                        strongsCandidateID = self.workingTokens[scriptureIndex + offset].get('token')
                        offset += 1

                        if (strongsCandidateID): # scripture token is mapped
                            tokenCandidate = self.strongs[str(strongsCandidateID)]

                            # explicit
                            if (contains(tokenCandidate, scriptureToken['content'], mustMatchWholeWord=True)): # is capitalisation an issue here?
                                # embedded article
                                # | the world |
                                self.linkTokens(scriptureIndex, strongsCandidateID, False, scriptureToken['content'])
                                tokenCandidate = None
                                break

                            # implicit
                            # tokenCandidate = self.strongs[str(int(strongsCandidateID) - 1)]
                            if (isNoun or any([tag['pos'] == 'noun' for tag in tokenCandidate['grammar']])):
                                if (self.synonymous(tokenCandidate, scriptureToken['content'], matchTolerance=MatchStrictness.SYNONYMS)):
                                    # explicit article
                                    # | the | world |
                                    self.linkTokens(scriptureIndex, int(strongsCandidateID) - 1, False)
                                    tokenCandidate = None
                                    break

                    if (allowImplicitArticles and tokenCandidate):
                        if ( # we are very particular about what we allow to be an implicit article
                            simplifyToken(scriptureToken) in ['the']
                            and any([tag['pos'] == 'noun' for tag in tokenCandidate['grammar']])
                        ):
                            # implicit article
                            # | world |
                            self.linkTokens(scriptureIndex, strongsCandidateID, False, -1)
                            continue

        # REVERT ANOMALIES
        def revertAnomalies(self):
            """
            Compare tokens with their neighbours, if one is drastically different, revert it.
            """
            for tokenIndex, scriptureToken in enumerate(self.workingTokens):

                token = scriptureToken.get('token')
                if (not token):
                    continue

                deltas = []

                for i in range(1, 3):
                    # check previous tokens
                    if (tokenIndex - i > 0):
                        previousToken = self.workingTokens[tokenIndex - i].get('token')
                        if (previousToken):
                            deltas.append(abs(int(token) - int(previousToken)) - i)

                    # check next tokens
                    if (tokenIndex + i < len(self.workingTokens)):
                        nextToken = self.workingTokens[tokenIndex + i].get('token')
                        if (nextToken):
                            deltas.append(abs(int(token) - int(nextToken)) - i)

                if (deltas):
                    delta = sum(deltas) / len(deltas) # TODO: is this a good metric?
                    if (delta > 6): # TODO: is this a good threshold?
                        self.workingTokens[tokenIndex]['token'] = None
            pass

    def lemmatiseWord(self, words, posTags, isStrongsTag=False):
        """
        Get the lemmas of a word.
        """
        lemmas = set()
        if (posTags := getWordnetPOS(posTags, isStrongsTag)):

            words = words.split(' ')
            for word in words:
                word = word.lower().strip(IGNORED_CHARS)

                if ((lemma := self.LEMMA_CACHE.get(word, None)) is not None): # check cache
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
                    self.LEMMA_CACHE[word] = tempLemmas
                    lemmas |= tempLemmas
                    continue

                self.LEMMA_CACHE[word] = None
        return lemmas

    def lemonymous(self, scriptureToken, strongsToken):
        """
        Do the two tokens share a lemma?
        If so, return the shared lemmas.
        """
        return (
            self.lemmatiseWord(simplifyToken(scriptureToken), scriptureToken.get('pos'))
            & self.lemmatiseWord(simplifyToken(strongsToken), strongsToken.get('grammar', []), True)
        )

    def synonymous(self, scriptureToken, strongsToken, matchTolerance, exhaustive=False):
        """
        Are the contents of the two tokensself.synonymous?
        If so, return the shared synonym.
        """

        if (matchTolerance == MatchStrictness.LEMMAS):
            if (lemmas := (list(self.lemonymous(scriptureToken, strongsToken)))):
                return lemmas
        if (matchTolerance == MatchStrictness.SYNONYMS):
            return list(
                getSynonyms(simplifyToken(scriptureToken))
                & getSynonyms(simplifyToken(strongsToken))
            )

        return False

# TODO: possible improvements
# - make use of some markers (wj tags, for instance) ?
# - make use of capitalisation ('Him' != 'him' see Matthew 9:9)

# - sc Lord = Yahweh

# some tokens need to map to multiple strongs (see John 3:5, for example)

# NEED TO LEMMATISE SYNONYMS!

def getSynonyms(word, posTags=None):
    """
    Get the synonyms of a word.
    """
    synonyms = set([word])

    synonymCandidates = thesaurus.get(word)
    if (synonymCandidates):
        for synonymList in synonymCandidates: # list of synonyms for the strongs word
            for synonym in synonymList:
                synonyms.add(synonym)
    return synonyms

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

# load thesaurus used for synonyms
with open(os.path.join(os.path.dirname(__file__), 'data', 'en_thesaurus.json'), 'r', encoding='utf-8') as thesaurusFile:
    thesaurus = json.load(thesaurusFile)

if (__name__ == "__main__"):
    tokeniser = Tokeniser()
    # tokeniser.tokenisePassage('GEN.1', 1, 'NKJV', visualise=True)
    # tokeniser.tokenisePassage('GEN.1', 1, 'ESV', visualise=True)
    # tokeniser.tokenisePassage('EST.8', 9, 'NKJV', visualise=True)
    # tokeniser.tokenisePassage('JHN.3', 16, 'NKJV', visualise=True)

    for temp in range(20, 32):
        tokeniser.tokenisePassage('GEN.1', temp, 'NKJV', visualise=True)
        # TODO
        # 20 'the' heavens (issue before linkArticles, not during)

        # 14 'and' (incorrect assignment)
        # 15, 17 (broad synonym) 'give light'
        # 21 'kinds' (incomplete lemma),
        # 28 'and' (BIBLE-118?)
        # 31
