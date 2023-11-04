
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
        for index, candidateToken in enumerate(tokenCandidates):
            if (candidateToken.strip() == ''):
                continue

            token = {}

            # reconstruct
            if (chunk.get('header') and index == 0): # this assumes there will never be a heading mid-verse
                token['header'] = chunk['header']

            if (chunk.get('type')):
                token['type'] = chunk['type']

            token['content'] = candidateToken

            tokens.append(token)
        pass
    pass

    # COUNT NUMBER OF OCCURRENCES OF EACH TOKEN
    tokenCounts = {}

    for token in tokens:

        # skip notes
        if (token.get('type') == 'note'):
            continue

        tokenContent = token['content']
        exisitngCount = tokenCounts.get(tokenContent)

        if (exisitngCount):
            tokenCounts[tokenContent] = exisitngCount + 1
        else:
            tokenCounts[tokenContent] = 1

    # LINK ANY WHOLE, EXACT, UNIQUE MATCHES
    for trueToken, trueTokenValue in strongs.items():

        if (trueTokenValue.get('eng') == '-'): # TODO use None instead
            continue

        for index, data in enumerate(tokens):

            # skip notes
            if (data.get('type') == 'note'):
                continue

            if (tokenCounts[data['content']] > 1): # UNIQUE
                continue

            # ignore punctuation
            dataRaw = data['content'].strip('.,;:?!') # TODO make more robust

            if (trueTokenValue['eng'] == dataRaw): # WHOLE, EXACT
                # update data to be tokenised
                data['token'] = trueToken
                tokens[index] = data
    pass

    # LINK DETERMINERS
        # this doesn't occur in this use case
        # (may never occur in Hebrew?)
        # (may still occur in Greek?)
    pass

    # LINK UNIQUE, INCOMPLETE MATCHES
    for trueToken, trueTokenValue in strongs.items():

        if (trueTokenValue.get('eng') == '-'): # TODO use None instead
            continue

        for index, data in enumerate(tokens):

            # skip notes
            if (data.get('type') == 'note'):
                continue

            if (tokenCounts[data['content']] > 1): # UNIQUE
                continue

            # ignore punctuation
            dataRaw = data['content'].strip('.,;:?!') # TODO make more robust

            if (dataRaw in trueTokenValue['eng']): # WHOLE, EXACT
                # update data to be tokenised
                data['token'] = trueToken
                tokens[index] = data
    pass

    # BRIDGE GAPS
    token = None
    chasm = []
    for index, data in enumerate(tokens):

        # skip notes
        if (data.get('type') == 'note'):
            continue

        newToken = data.get('token')
        if (newToken):
            if (token != newToken):
                token = newToken
                # clear chasm
                chasm = []
            else:
                # link chasm
                for chasmIndex in chasm:
                    tokens[chasmIndex]['token'] = token
        else:
            chasm.append(index)
    pass

    # LINK EMBEDDED DETERMINERS
    for index, data in enumerate(tokens):

        # skip notes
        if (data.get('type') == 'note'):
            continue

        if (data.get('content') == 'the'): # TODO expand
            if (len(tokens) > index + 1):
                tokenCandidate = tokens[index + 1].get('token')
                if (tokenCandidate):
                    tokens[index]['token'] = tokenCandidate
    pass

    # ABSORB LOOSE TOKENS
        # ARE ANY TRUE TOKENS NOT USED?
    pass

    for token in tokens:
        # skip notes
        if (token.get('type') == 'note'):
            continue
        if (not token.get('token')):
            pass # FAILURE

    # RECONSTRUCT TOKENS
    # we originally tokenised the scripture into individual words, whereas the target tokens may be larger chunks,
    # it may be possible to reconstruct the scripture into some larger tokens, which would reduce the number of individual tokens
    newToken = {}
    newTokens = []
    currentToken = None

    for token in tokens:
        if (currentToken != token.get('token')): # new token
                if (newToken != {}):
                    newTokens.append(newToken)

                newToken = token
                currentToken = token.get('token')
        else: # same token as previous
            if (token.get('type') == newToken.get('type')):
                newToken['content'] += f' {token["content"]}' # TODO this may not be ideal
    newTokens.append(newToken)
    pass

    return newTokens

    # TODO
    # - make use of NKJV italics markers

scripture = [ #NKJV
    { "header": "The History of Creation", "type": "p", "content": "In the " },
    { "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },
    { "content": "beginning " },
    { "type": "note", "content": "Gen. 2:4; (Ps. 8:3; 89:11; 90:2); Is. 44:24; Acts 17:24; Rom. 1:20; (Heb. 1:2; 11:3); Rev. 4:11" },
    { "content": "God created the heavens and the earth. " }
]
# scripture = [ #ESV
#     { "header": "The Creation of the World", "type": "p", "content": " " },
#     { "content": "In the " },
#     { "type": "note", "content": "Job 38:4-7; Ps. 33:6; 136:5; Isa. 42:5; 45:18; John 1:1-3; Acts 14:15; 17:24; Col. 1:16, 17; Heb. 1:10; 11:3; Rev. 4:11" },
#     { "content": "beginning, God created the heavens and the earth. " }
# ]
strongs = { 
    "0": { "strongs": "7225", "eng": "In the beginning" },
    "1": { "strongs": "1254", "eng": "created" },
    "2": { "strongs": "430", "eng": "God" },
    "3": { "strongs": "853", "eng": "-" },
    "4": { "strongs": "8064", "eng": "the heavens" },
    "5": { "strongs": "853", "eng": "and" },
    "6": { "strongs": "776", "eng": "the earth" }
}

if __name__ == "__main__":
    tokenise(scripture, strongs)