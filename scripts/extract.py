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


def readString(arrayOfByte, start=3):
    """
    Convert a portion of an array of bytes to a string.

    Parameters:
        arrayOfByte (bytes): An array of bytes to be processed.
        i (int, optional): The starting index in the array (default is 3).

    Returns:
        str: The resulting string extracted from the array of bytes.
    """

    byteArray = []
    i = start
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
        b = readString(arrayOfByte, 4) if (start == 3) else None
        if (b == None):
            pass
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
    # open(os.path.join(outDir, f'MONOLITH.html'), 'w').close()

    # DEBUG
    # manifest = [{
    #     "usfm": "MAT",
    #     "title": "Matthew",
    #     "prefix": "The Gospel According to",
    #     "chapters": [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20]
    # }]

    # BODY
    for book in manifest:
        if ('full-title' in book):
            print(book['full-title'])
        else:
            print(book['title'])

        for chapter in range(len(book['chapters']) + 1):
            if (chapter == 0):
                chapter = 'INTRO'
            # if (book['usfm'] == 'MAT' and chapter == 5): # DEBUG
            #     pass

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
                print(f'\t{bcolors.ERROR}error: could not read {fileName}{bcolors.ENDC}')
                continue

            data = data[:data.rindex('</div>')+6]  # remove everything outside of final div

            # DECODE
            out = data.encode('latin1').decode('utf-8')

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

    # STRIP HTML, MAINTAINING PARAGRAPH STRUCTURE
    html = data.strip()
    html = re.sub(r'\n\s*', '', html)

    # PARSE HTML
    soup = BeautifulSoup(html, 'html.parser')
    root = soup.div

    global verses, verse, div, header

    verses = []
    verse = []
    div = False
    header = None

    def thisNeedsAName(element, parentClasses=[]):
        global verses, verse, div, header

        newParentClasses = parentClasses.copy()

        if (isinstance(element, str)): # NKJV DEU 28:58
            verses.append({'content': element})
            return

        elementClass = element.get('class')[0]

        # leaf node
        if (len(element.contents) == 1) and (isinstance(element.contents[0], str)):
            
            # NEW VERSE
            if (elementClass == 'label'):
                newVerseNumber = (int)(element.text)
                if ((newVerseNumber > len(verses))):

                    if (len(verses) == 0):  # initial
                        verses.append([])
                    else:
                        # push and reset
                        verses.append(verse)
                        verse = []
                    
            else:
                # paragraph formatting (p, q1, etc.)
                if (div):
                    if (elementClass != 'content'):
                        pass # this should never fire
                    elementClass = div
                    #verse.append({ "type": "p", "content": " " })
                    div = False

                # verse formatting (wj, nb, etc.)
                if (parentClasses != []):
                    if (elementClass != 'content'):
                        for parentClass in parentClasses:
                            elementClass += f' {parentClass}'
                    else:
                        elementClass = parentClasses[0]

                section = {}

                if (header is not None):
                    section['header'] = header
                    header = None

                if (elementClass != 'content'):
                    if (elementClass not in ['p', 'm', 'pmr', 'pc', 'q1', 'q2', 'q3', 'qr']):
                        pass # this should fire (wj)
                    section['type'] = elementClass

                section['content'] = element.contents[0]
                
                verse.append(section)
                #print(verse[-1]) #temp

        # non-leaf node
        else:

            # HEADER
            if (elementClass in ['s', 's1', 'sp', 'ms', 'qa', 'd']): #TODO
                header = element.text
                return

            # NEW PARAGRAPH
            if (elementClass in ['p', 'm', 'pmr', 'pc', 'q1', 'q2', 'q3', 'qr']): #TODO
                div = elementClass

            elif (elementClass not in ['version', 'content', 'verse', 'chapter', 'book', 'note']):
                newParentClasses.append(elementClass)

            # FOOTNOTE
            if ('note' in elementClass):
                # TODO; allow nested children with formatting
                noteContents = element.text.strip()
                noteContents = re.sub(r'#(?:(\d+):(\d+))?', '', noteContents)

                noteContents = noteContents.replace('–', '-')

                if (div):
                    verse.append({ "type": div, "content": "" })
                    div = False
                verse.append({'type': 'note', 'content': noteContents})

            else:
                for child in element.children:
                    thisNeedsAName(child, newParentClasses)
    
    thisNeedsAName(root)
    verses.append(verse)

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

    # # DEBUGGING
    # for translation in ['NKJV', 'ESV']:
    #     root = os.path.join(os.path.dirname(__file__), 'data', translation)
    #     extract(os.path.join(root, 'source'), os.path.join(root, translation))