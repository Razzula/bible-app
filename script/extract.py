import sys
import os
import json
import re

from bs4 import BeautifulSoup


class bcolors:
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
    with open(paramFile, 'rb') as f:
        arrayOfByte = f.read()
        return readString(arrayOfByte)


def readString(arrayOfByte, i=3):

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
        #if (current not in b):
        #    pass
        return b
    return a


#EXTRACT
def extract(directory):

    global current

    if (not os.path.isdir(os.path.join(directory, 'new'))):
        os.mkdir(os.path.join(directory, 'new'))  # create /new/

    # BODY
    for book in manifest:
        print(book['title'])
        pass

        for chapter in range(1, book['chapters']+1):
            current = f'{book["usfm"]}.{chapter}'
            #if (current != 'MAT.5'):
            #    continue
            #pass

            fileName = os.path.join(directory, 'original',current)
            if (not os.path.exists(fileName)):
                if ('INTRO' in fileName):
                    print(f'{bcolors.WARNING}error: {fileName} does not exist{bcolors.ENDC}')
                else:
                    print(f'{bcolors.ERROR}error: {fileName} does not exist{bcolors.ENDC}')
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

            makeSimple(out, directory, book['usfm'], current)

        #break # just Genesis

    print('DONE')


# SIMPLIFY
def makeSimple(data, dir, book, file):  # HTML to JSON
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
            cleantext = re.sub(re.compile(r'<span class="note x"><span class="label">#</span><span class=" body">([^#]+?)</span></span>'), f'<span class="note">{noteContent}</span>', cleantext, 1)  # remove footnotes

            note = re.search(re.compile(r'<span class="note x"><span class="label">#</span><span class=" body">([^#]+?)</span></span>'), cleantext)

        # div
        para = re.match(re.compile(f'<div class="([^>]+)"><span class="verse v\d+" data-usfm="{book}\.\d+\.\d+"><span class="label">\d+</span>'), cleantext)
        if (not para):
            para = re.match(re.compile(f'<div class="([^>]+)"><span class="verse v\d+" data-usfm="{book}\.\d+\.\d+">'), cleantext)
        if (not para):   # heading
            header = '~'
            headers.append(re.sub(re.compile('<[^>]+>'), '', cleantext))
            continue  #TODO

        p = para.regs[0][1]
        cleantext = re.sub(re.compile(r'<div class="([^>]+)">'), '', cleantext[(para.regs[1][1]+2):p] + header + f'[{cleantext[para.regs[1][0]:para.regs[1][1]]}]' + cleantext[p:], 1)  # <div class='p'><...>1</>... ==> <...>1</>[p]...
        cleantext = re.sub(re.compile('</div>'), '', cleantext)

        # content tags
        cleantext = re.sub(re.compile('<span class="content">'), '<span>', cleantext)

        # #headings
        # cleantext = re.sub(re.compile('<div class="s"><span class="heading">[^>]+</span></div>'), '', cleantext)
        # if (cleantext == ''):
        #     continue

        if (header):
            header = ''
        if (cleantext != ''):
            text += cleantext

    # SPLIT INTO VERSES
    verses = re.split(re.compile(f'<span class="verse v\d+" data-usfm="{book}\.\d+\.\d+"><span class="label">\d+</span>'), text)
    pass

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
                        result['type'].extend(element.contents[0]['class'])  #TODO; prevent duplication
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
        verse = re.sub(re.compile(f'<span class="verse v\d+" data-usfm="{book}\.\d+\.\d+">'), '', verses[i])  # remove additinal verse markers

        soup = BeautifulSoup(f'<div>{verse}</div>', 'html.parser')
        root = soup.find('div')
        node = create_node(root)

        if ('children' in node):
            #if ('type' in node):
            #    pass
            node = node['children']

        if ('type' in node):
            node['type'] = ' '.join(node['type'])
        else:
            for subnode in node:
                if ('type' in subnode):
                    subnode['type'] = ' '.join(subnode['type'])

        # update
        verses[i] = node
    pass

    # OUT
    outJSON = json.dumps(verses[1:], indent=4)
    with open(f'{dir}/new/{file}', 'w') as f:
        f.write(outJSON)

    # reformat file (condensed)
    with open(f'{dir}/new/{file}', 'r') as f:
        temp = f.read()
    temp = re.sub(re.compile(r'\n            '), ' ', temp)
    temp = re.sub(re.compile(r'\n        },'), ' },', temp)
    temp = re.sub(re.compile(r'\n        }'), ' }', temp)
    with open(f'{dir}/new/{file}', 'w') as f:
        f.write(temp)


## START
manifest = json.load('manifest.json')

if (len(sys.argv) < 2):  # check there are 3 arguments: the script, input, output
    print('error: insufficient arguments')
else:
    if (os.path.isdir(os.path.join(sys.argv[1], 'original'))):
        extract(sys.argv[1])
    else:
        print(f'directory /{sys.argv[1]}/original does not exist')
#extract('NKJV')
