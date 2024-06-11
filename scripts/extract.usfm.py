# pylint: disable=fixme, line-too-long, invalid-name, superfluous-parens, trailing-whitespace, arguments-differ
"""TODO"""
import os
import re
import json
from pathlib import Path
import string
import subprocess

from usfm_grammar import USFMParser, Filter

rootDir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'WEBBE')

def parseUSFM(usfmText):
    """TODO"""
    chapters = {}
    currentChapter = None
    currentVerse = None
    tokens = []

    newParagraph = False

    for line in usfmText.splitlines():

        skip = False
        for marker in ['\\id', '\\ide ', '\\h ', '\\toc', '\\mt']:
            if (line.startswith(marker)):
                skip = True
                break
        if (skip):
            continue
        pass

        if (line.startswith('\\c ')):
            # CHAPTER
            currentChapter = line.split()[1]
            chapters[currentChapter] = {}
        elif line.startswith('\\p'):
            # PARAGRAPH
            newParagraph = True
            continue
        elif line.startswith('\\v '):
            # VERSE
            if (currentVerse is not None and tokens):
                # write previous verse
                chapters[currentChapter][currentVerse] = tokens
                tokens = []

            parts = line.split(' ', 2)
            currentVerse = parts[1]
            tokenText = parts[2]

            tokens.extend(parseTokens(tokenText, newParagraph=newParagraph))
            newParagraph = False

    if (currentVerse is not None and tokens):
        chapters[currentChapter][currentVerse] = tokens

    return chapters

def parseUSJ(usfmData):

    chapters = {}
    currentChapter = None
    currentVerse = None
    tokens = []

    newParagraph = False

    for line in usfmData:
        if (line.marker in ['id', 'ide', 'h', 'toc', 'mt']):
            continue

        if (line.marker == 'c'):
            # CHAPTER
            pass
        elif (line.marker == 'p'):
            # PARAGRAPH
            pass
        elif (line.marker == 'v'):
            # VERSE
            pass
        else:
            # TOKEN
            pass

        pass

    pass

    return None


def parseTokens(inputText, newParagraph=False, count=0, tags=None):
    """TODO"""
    if (tags is None):
        tags = []

    tokens = []
    PATTERN = r'\\w\*?\s*(?!\w)'
    # print(PATTERN.format(count))
    if (count > 0):
        # print(r'\\(\+{{{0}}})'.format(count))
        inputText = re.sub(r'\\(\+{{{0}}})'.format(count), r'\\', inputText)
        pass

    words = re.split(PATTERN.format(count), inputText)
    for word in words:
        word = word.strip()
        if (not word):
            continue

        token = {}
        tempTags = tags.copy()

        # process token
        if ('\\wj' in word):
            # everything in this 'word' is actually multiple words, with special formatting
            newInput = ''
            pre, data, post = re.split(r'\\wj\*?', word)

            tempTags.append('wj')
            newTokens = parseTokens(data, count=count+1, tags=tempTags)

            if (pre.strip()):
                tokens.append(newToken(pre.strip(), tempTags, newParagraph))
            if (newTokens):
                tokens.extend(newTokens)
            if (post.strip()):
                tokens.append(newToken(post.strip(), tempTags, newParagraph))
        elif ('|strong="' in word):
            word, strong = word.split('|strong="')
            token = newToken(word, tempTags)
            token['strongs'] = strong.rstrip(r'"\w*')
        elif (word.startswith('\\f')):
            data = re.findall(r'\\ft (.*)\\ft?\*', word)
            data = re.sub(r'\\\+?wh\s?\*?', '', data[0])
            token = newToken(data, tempTags, newParagraph)
        else:
            token = newToken(word, tempTags, newParagraph)

        tokens.append(token)
        newParagraph = False
    return tokens

def newToken(word, tags=None, newParagraph=False):
    if (tags is None):
        tempTags = []
    else:
        tempTags = tags.copy()

    token = {}
    token['content'] = word

    if (all(char in string.punctuation for char in word)):
        tempTags.append('punctuation')
    if (newParagraph):
        tempTags.append('p')

    if (tempTags):
        token['tags'] = ' '.join(list(set(tempTags)))
    return token

def convertToJSON(inputDir, fileName, translation):
    """TODO"""


    with open(os.path.join(inputDir, fileName), 'r', encoding='utf-8') as f:
        usfmText = f.read()

    usfmData = USFMParser(usfmText).to_usj()

    chapters = parseUSJ(usfmData['content'])
    pass
    bookName = fileName.split('.')[0]
    pass

    for chapter, verses in chapters.items():
        jsonPath = os.path.join(rootDir, translation, f'{bookName}.{chapter}')
        if (os.path.exists(os.path.dirname(jsonPath)) is False):
            os.makedirs(os.path.dirname(jsonPath))
        with open(jsonPath, 'w', encoding='utf-8') as jsonFile:
            json.dump(verses, jsonFile, ensure_ascii=False, indent=4)

        # reformat file (condensed)
        with open(jsonPath, 'r', encoding='utf-8') as f:
            temp = f.read()
        temp = re.sub(re.compile(r'\n            '), ' ', temp)
        temp = re.sub(re.compile(r'\n        },'), ' },', temp)
        temp = re.sub(re.compile(r'\n        }'), ' }', temp)
        with open(jsonPath, 'w', encoding='utf-8') as f:
            f.write(temp)


if (__name__ == '__main__'):


    inputDir = os.path.join(rootDir, 'source')
    for file in os.listdir(inputDir):
        if (file.endswith('.usfm')):
            convertToJSON(inputDir, file, 'WEBBE')
            print(file)
