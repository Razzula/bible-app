import json
import os
import json


def tokenisePassage(passage, verse, translation):

    with open(os.path.join(os.path.dirname(__file__), 'data', translation, translation, passage), 'r') as f:
        data = json.load(f)
    scripture = data[verse - 1]

    with open(os.path.join(os.path.dirname(__file__), 'data', 'strongs', f'{passage}.json'), 'r') as f:
        data = json.load(f)
    strongs = data[str(verse)]

    if (scripture and strongs):
        return tokenise(scripture, strongs)
    return None


def tokenise(scripture, strongs):

    tokens = []

    # FIRST, BREAK DOWN THE SCRIPTURE INTO INDIVIDUAL TOKENS
    for chunk in scripture:

        if (chunk.get('type') == 'note'):
            tokens.append(chunk) # notes don't need tokenising, but are left in the array to preserve the order
            continue

        if (chunk.get('content') == ' '):
            pass

        tokenCandidates = chunk['content'].split(' ') # TODO handle (most) punctuation as individual tokens
        for candidateTokenIndex, candidateToken in enumerate(tokenCandidates):
            if (candidateToken.strip() == ''):
                continue

            token = {}

            # reconstruct
            if (chunk.get('header') and candidateTokenIndex == 0): # this assumes there will never be a heading mid-verse
                token['header'] = chunk['header']

            if (chunk.get('type')):
                token['type'] = chunk['type']

            token['content'] = candidateToken

            tokens.append(token)
        pass
    pass

    # COUNT NUMBER OF OCCURRENCES OF EACH TOKEN
    tokenCounts = {} # { token: (scriptureCount, strongsCount) }

    for token in tokens:

        # skip notes
        if (token.get('type') == 'note'):
            continue

        tokenContent = token['content'].lower().strip('.,;:?!')
        exisitngCount = tokenCounts.get(tokenContent)

        if (exisitngCount):
            tokenCounts[tokenContent] = (exisitngCount[0] + 1, exisitngCount[1])
        else:
            tokenCounts[tokenContent] = (1, 0)

    for token in strongs.values():

        tokenContent = simplifyToken(token)
        for word in tokenContent.split(' '):

            exisitngCount = tokenCounts.get(word)

            if (exisitngCount):
                tokenCounts[word] = (exisitngCount[0], exisitngCount[1] + 1)
            else:
                tokenCounts[word] = (0, 1)

    # LINK ANY WHOLE, EXACT, UNIQUE MATCHES
    for strongsTokenID, strongsToken in strongs.items():

        if (strongsToken.get('eng') == '-'): # TODO use None instead
            continue

        for scriptureIndex, scriptureToken in enumerate(tokens):

            if (tokenIsDirty(scriptureToken)):
                continue

            if (tokenCounts[simplifyToken(scriptureToken)] == (1, 1)): # ensure UNIQUE
                if (equals(scriptureToken, strongsToken)): # ensure WHOLE, EXACT
                    # update data to be tokenised
                    scriptureToken['token'] = strongsTokenID
                    tokens[scriptureIndex] = scriptureToken
                    continue
    pass

    # LINK DETERMINERS
    for strongsTokenID, strongsToken in strongs.items():
        # we are assuming that the token `the` and `[object]` are always subsequent
        # is this safe?

        if (simplifyToken(strongsToken) == 'the'): # TODO expand

            # find token that matches the next strongs token
            # e.g. in ['the', 'world'], find 'world'
            for scriptureIndex, scriptureToken in enumerate(tokens):

                if (scriptureToken.get('token') == str(int(strongsTokenID) + 1)): # assumption (see above)
                    # find the corresponding determiner
                    i = 0
                    while (scriptureIndex - i > 1):
                        i += 1
                        previousToken = tokens[scriptureIndex - i]
                        if (previousToken.get('type') == 'note'): # skip notes
                            continue
                        if (previousToken.get('token')): # don't overwrite existing tokens
                            break

                        if (equals(previousToken, strongsToken)):
                            tokens[scriptureIndex - i]['token'] = strongsTokenID
                        break
    pass

    # LINK UNIQUE, INCOMPLETE MATCHES
    for strongsTokenID, strongsToken in strongs.items():

        if (strongsToken.get('eng') == '-'): # TODO use None instead
            continue
        pass

        for scriptureIndex, scriptureToken in enumerate(tokens):

            if (tokenIsDirty(scriptureToken)):
                continue

            if (tokenCounts[simplifyToken(scriptureToken)] == (1, 1)): # ensure UNIQUE
                if (contains(strongsToken, scriptureToken, mustMatchWholeWord=True)): # WHOLE, EXACT
                    # update data to be tokenised
                    scriptureToken['token'] = strongsTokenID
                    tokens[scriptureIndex] = scriptureToken
    pass

    # BRIDGE GAPS
    currentToken = None
    chasm = []
    for scriptureIndex, scriptureToken in enumerate(tokens):

        if (tokenIsDirty(scriptureToken)):
            continue

        scriptureTokenID = scriptureToken.get('token')
        if (scriptureTokenID):
            if (token != scriptureTokenID):
                token = scriptureTokenID
                # clear chasm
                chasm = []
            else:
                # link chasm
                for chasmIndex in chasm:
                    tokens[chasmIndex]['token'] = token
        else:
            chasm.append(scriptureIndex)
    pass

    # LINK EMBEDDED DETERMINERS
    for scriptureIndex, scriptureToken in enumerate(tokens):

        if (tokenIsDirty(scriptureToken)):
            continue

        if (simplifyToken(scriptureToken) == 'the'): # TODO expand
            if (len(tokens) > scriptureIndex + 1):
                tokenCandidateID = tokens[scriptureIndex + 1].get('token')
                if (tokenCandidateID):
                    tokens[scriptureIndex]['token'] = tokenCandidateID
    pass

    # ABSORB LOOSE TOKENS
        # ARE ANY TRUE TOKENS NOT USED?
    pass

    # CHECK STATUS
    for token in tokens:
        if (tokenIsDirty(token)):
            continue
        pass # FAILURE
        break

    # RECONSTRUCT TOKENS
    # we originally tokenised the scripture into individual words, whereas the target tokens may be larger chunks,
    # it may be possible to reconstruct the scripture into some larger tokens, which would reduce the number of individual tokens
    newToken = {}
    newTokens = []
    currentToken = -1 # cannot use 'None', as a note will have this token

    for token in tokens:

        newTokenID = token.get('token')
        if (currentToken != newTokenID): # new token
                if (newToken != {}):
                    newTokens.append(newToken)

                newToken = token
                currentToken = newTokenID
        else: # same token as previous
            if (token.get('type') == newToken.get('type')):
                newToken['content'] += f' {token["content"]}' # TODO this may not be ideal

    if (newToken != {}): # append last token
        newTokens.append(newToken)
    pass

    return newTokens

    # TODO
    # - make use of NKJV italics markers

def equals(scriptureToken, strongsToken):
    return simplifyToken(scriptureToken) == simplifyToken(strongsToken)

def contains(strongsToken, scriptureToken, mustMatchWholeWord=False): # this is imperfect
    if (mustMatchWholeWord):
        strongsContainer = simplifyToken(strongsToken).split(' ')
    else:
        strongsContainer = simplifyToken(strongsToken)

    return simplifyToken(scriptureToken) in strongsContainer

def simplifyToken(token):
    if (token.get('content')):
        return token['content'].lower().strip('.,;:?!')
    elif (token.get('eng')):
        return token['eng'].lower().strip('.,;:?!')
    return None

def tokenIsDirty(token):
    return (token.get('type') == 'note') or token.get('token')
        # TODO use an array for more cases instead of just 'note'

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

if __name__ == "__main__":
    # tokenisePassage('GEN.1', 1, 'NKJV')
    # tokenisePassage('GEN.1', 1, 'ESV')
    # tokenisePassage('EST.8', 9, 'NKJV')
    tokenisePassage('JHN.3', 16, 'NKJV')