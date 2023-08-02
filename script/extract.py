import sys
import os
import json
import re

from bs4 import BeautifulSoup


class bcolors:
    """
    A class to define escape codes for colored text in the terminal.

    Attributes:
        ERROR (str): Red.
        WARNING (str): Yellow.
        ENDC (str): Reset to default.
    """

    ERROR = '\033[91m'
    WARNING = '\033[93m'
    ENDC = '\033[0m'


LATIN_1_CHARS = (
    ('\xe2\x80\x99', "'"),
    ('\xc3\xa9', 'e'),
    ('\xe2\x80\x90', '-'),
    ('\xe2\x80\x91', '-'),
    ('\xe2\x80\x92', '-'),
    ('\xe2\x80\x93', '-'),
    ('\xe2\x80\x94', '-'),
    ('\xe2\x80\x94', '-'),
    ('\xe2\x80\x98', "'"),
    ('\xe2\x80\x9b', "'"),
    ('\xe2\x80\x9c', '"'),
    ('\xe2\x80\x9c', '"'),
    ('\xe2\x80\x9d', '"'),
    ('\xe2\x80\x9e', '"'),
    ('\xe2\x80\x9f', '"'),
    ('\xe2\x80\xa6', '...'),
    ('\xe2\x80\xb2', "'"),
    ('\xe2\x80\xb3', "'"),
    ('\xe2\x80\xb4', "'"),
    ('\xe2\x80\xb5', "'"),
    ('\xe2\x80\xb6', "'"),
    ('\xe2\x80\xb7', "'"),
    ('\xe2\x81\xba', "+"),
    ('\xe2\x81\xbb', "-"),
    ('\xe2\x81\xbc', "="),
    ('\xe2\x81\xbd', "("),
    ('\xe2\x81\xbe', ")"),

    ('\xe2\x80\x86', '"'),
    ('Ä\x92Â', 'Ē'),

    ('×\x90', 'א'),
    ('×\x91', 'ב'),
    ('×\x92', 'ג'),
    ('×\x93', 'ד'),
    ('×\x94', 'ה'),
    ('×\x95', 'ו'),
    ('×\x96', 'ז'),
    ('×\x97', 'ח'),
    ('×\x98', 'ט'),
    ('×\x99', 'י'),
    ('×\x9a', 'כ'),
    ('×\x9b', 'ל'),
    ('×\x9c', 'מ'),
    ('×\x9d', 'נ'),
    ('×\x9e', 'ס'),
    ('×\x9f', 'ע'),
    ('×\xa0', 'פ'),
    ('×\xa1', 'צ'),
    ('×\xa2', 'ק'),
    ('×\xa3', 'ר'),
    ('×©×\x81', 'ש'),
    ('×\xa5', 'ת')
)


current = ''
headers = []


def readFile(paramFile):
    """
    Read a binary file and convert its contents to a string.

    Parameters:
        paramFile (str): The path to the binary file to be read.

    Returns:
        str: The contents of the binary file as a string.
    """

    with open(paramFile, 'rb') as f:
        arrayOfByte = f.read()
        return readString(arrayOfByte)


def readString(arrayOfByte, i=3):
    """
    Convert a portion of an array of bytes to a string.

    Parameters:
        arrayOfByte (bytes): An array of bytes to be processed.
        i (int, optional): The starting index in the array (default is 3).

    Returns:
        str: The resulting string extracted from the array of bytes.
    """

    byteArray = []
    while (i < len(arrayOfByte)):
        if (len(arrayOfByte) > i + 1):
            j = ((int('0xFF', 16) & arrayOfByte[(i + 1)]) >> 5 | (int('0xFF', 16) & arrayOfByte[(i + 1)]) << 3)
            byteArray.append(j)
            byteArray.append((int('0xFF', 16) & arrayOfByte[i]) >> 5 | (int('0xFF', 16) & (arrayOfByte[i]) << 3))
        else:
            byteArray.append((int('0xFF', 16) & arrayOfByte[i]) >> 5 | (int('0xFF', 16) & (arrayOfByte[i]) << 3))

        i += 2

    a = ''.join([(chr(x & 0xFF)) for x in byteArray])

    if (current not in a):
        b = readString(arrayOfByte, 4)
        return b
    return a


# EXTRACT
def extract(inDir, outDir):
    """
    Extract and process data from input directory and create new files in the output directory.

    Parameters:
        inDir (str): The input directory containing the data files to be processed.
        outDir (str): The output directory where the processed files will be stored.

    Returns:
        None

    Global Variables Used:
        current (str): A global variable used to keep track of the current file being processed.

    Notes:
        Assumes the presence of a 'manifest.json' file in the 'public' subdirectory
        located relative to the script file. This file is used to load the 'manifest' data.

        Assumes inputs are in .yves format.
    """

    global current

    root = os.path.dirname(__file__)

    with open(os.path.join(root, '..', 'public', 'manifest.json'), 'r') as f:
        manifest = json.load(f)

    if (not os.path.isdir(outDir)):
        os.mkdir(outDir)  # create

    # BODY
    for book in manifest:
        if ('full-title' in book):
            print(book['full-title'])
        else:
            print(book['title'])

        for chapter in range(len(book['chapters']) + 1):
            if (chapter == 0):
                chapter = 'INTRO'

            current = f'{book["usfm"]}.{chapter}'

            fileName = os.path.join(inDir, current)
            if (not os.path.exists(fileName)):
                if ('INTRO' in fileName):
                    print(f'\t{bcolors.WARNING}{current}{bcolors.ENDC}')
                else:
                    print(f'\t{bcolors.ERROR}{current}{bcolors.ENDC}')
                continue

            data = readFile(fileName)
            if not data:
                print(f'{bcolors.ERROR}error: could not read {fileName}{bcolors.ENDC}')
                continue

            data = data[:data.rindex('</div>')+6]  # remove everything outside of final div
            chapterLines = data.splitlines()

            out = []

            for line in chapterLines[2:len(chapterLines)-1]:
                for _hex, _char in LATIN_1_CHARS:
                    line = line.replace(_hex, _char)

                out.append(line[6:])
                if (line == '      </div>'):
                    break

            simplify(out, outDir, book['usfm'], current)

    print('DONE')


# SIMPLIFY
def simplify(data, outDir, book, file):  # HTML to JSON
    """
    Process data in HTML format and save it as JSON.

    Parameters:
        data (list): A list of strings containing the HTML data to be processed.
        outDir (str): The directory where the processed data will be saved as JSON.
        book (str): The book identifier.
        file (str): The name of the file being processed.

    Returns:
        None

    Global Variables Used:
        headers (list): A global list to store extracted headers during processing.

    Notes:
        Assumes the presence of specific HTML tags for different content types,
        such as 'div' tags for paragraphs and 'span' tags for content.
    """

    global headers

    # STRIP HTML, MAINTAINING PARAGRAPH STRUCTURE
    text = ''
    headers = []
    header = ''

    for i in range(2, len(data)-1):
        cleantext = data[i].strip()

        # footnotes
        note = re.search(re.compile(r'<span class="note x"><span class="label">#</span><span class=" body">([^#]+?)</span></span>'), cleantext)
        while (note):
            noteContent = cleantext[note.regs[1][0]:note.regs[1][1]]

            # squash 'x, x+1' notation
            commaNotation = re.findall(re.compile(r'(\d+), (?=(\d+))'), noteContent)
            if (commaNotation):
                for match in commaNotation:

                    initialVerse = int(match[0])
                    finalVerse = int(match[1])

                    if (initialVerse + 1 == finalVerse):
                        noteContent = re.sub(re.compile(f'{initialVerse}, {finalVerse}'), f'{initialVerse}-{finalVerse}', noteContent)

            cleantext = re.sub(re.compile(r'<span class="note x"><span class="label">#</span><span class=" body">([^#]+?)</span></span>'), f'<span class="note">{noteContent}</span>', cleantext, 1)  # remove footnotes
            note = re.search(re.compile(r'<span class="note x"><span class="label">#</span><span class=" body">([^#]+?)</span></span>'), cleantext)

        # div
        para = re.match(re.compile(fr'<div class="([^>]+)"><span class="verse v\d+" data-usfm="{book}\.\d+\.\d+"><span class="label">\d+</span>'), cleantext)
        if (not para):
            para = re.match(re.compile(fr'<div class="([^>]+)"><span class="verse v\d+" data-usfm="{book}\.\d+\.\d+">'), cleantext)
        if (not para):   # heading
            header = '~'
            headers.append(re.sub(re.compile('<[^>]+>'), '', cleantext))
            continue

        p = para.regs[0][1]
        cleantext = re.sub(re.compile(r'<div class="([^>]+)">'), '', cleantext[(para.regs[1][1]+2):p] + header + f'[{cleantext[para.regs[1][0]:para.regs[1][1]]}]' + cleantext[p:], 1)  # <div class='p'><...>1</>... ==> <...>1</>[p]...
        cleantext = re.sub(re.compile('</div>'), '', cleantext)

        # content tags
        cleantext = re.sub(re.compile('<span class="content">'), '<span>', cleantext)

        if (header):
            header = ''
        if (cleantext != ''):
            text += cleantext

    # SPLIT INTO VERSES
    verses = re.split(re.compile(fr'<span class="verse v\d+" data-usfm="{book}\.\d+\.\d+"><span class="label">\d+</span>'), text)

    # formatting
    def create_node(element):
        global headers

        result = {}
        if element.name:

            # CLASS
            if (element.attrs):
                result['type'] = element['class']

            # CONTENT
            if element.string:  # raw text
                result['content'] = element.string

                if ((element.contents) and (element.contents[0].name) and (element.contents[0].has_attr('class'))):
                    if ('type' in result):
                        result['type'].extend(element.contents[0]['class'])  # TODO; prevent duplication
                    else:
                        result['type'] = element.contents[0]['class']

            elif element.contents:  # children
                children = []

                for child in element.contents:

                    if (child.name):  # child is an element
                        children.append(create_node(child))

                    else:
                        if ('[' in child) or ('~' in child):  # meta
                            if ('[' in child):  # new paragraph
                                para = re.findall(re.compile(r'\[(p|pc|q1|q2|s)\]'), child)[0]
                                children.append({'type': [para]})
                            if ('~' in child):  # subheading
                                children[-1]['header'] = headers[0]
                                headers = headers[1:]

                        else:
                            children.append({'content': child})

                if (len(children) > 0):
                    result['children'] = children

        return result

    for i in range(1, len(verses)):
        verse = re.sub(re.compile(fr'<span class="verse v\d+" data-usfm="{book}\.\d+\.\d+">'), '', verses[i])  # remove additinal verse markers

        soup = BeautifulSoup(f'<div>{verse}</div>', 'html.parser')
        root = soup.find('div')
        node = create_node(root)

        if ('content' in node and 'type' not in node):
            node = [node]  # {content: ...} --> [{content: ...}]

        if ('children' in node):
            node = node['children']

        if ('type' in node):
            node['type'] = ' '.join(node['type'])
        else:
            for subnode in node:
                if ('type' in subnode):
                    subnode['type'] = ' '.join(subnode['type'])

        # update
        verses[i] = node

    # OUT
    outJSON = json.dumps(verses[1:], indent=4)
    outDir = os.path.join(outDir, file)
    with open(outDir, 'w') as f:
        f.write(outJSON)

    # reformat file (condensed)
    with open(outDir, 'r') as f:
        temp = f.read()
    temp = re.sub(re.compile(r'\n            '), ' ', temp)
    temp = re.sub(re.compile(r'\n        },'), ' },', temp)
    temp = re.sub(re.compile(r'\n        }'), ' }', temp)
    with open(outDir, 'w') as f:
        f.write(temp)


# START
def main(args):
    """
    Entry point of the script for processing translation data.
    """

    if (len(args) < 2):  # check there are 3 arguments: the script, & translation
        print('error: insufficient arguments')
    else:
        if (os.path.isdir(os.path.join(args[1]))):
            extract(args[1], args[2])
        else:
            print(f'directory /{args[1]}/ does not exist')


if __name__ == "__main__":
    main(sys.argv)
