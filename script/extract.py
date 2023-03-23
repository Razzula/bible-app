import sys, os, json, re

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

def readFile(paramFile):
    try:
        file = open(paramFile, 'rb')
    except:
        return None

    arrayOfByte = file.read()
    return readString(arrayOfByte)

def readString(arrayOfByte, i=3):

    byteArray = []
    while (i < len(arrayOfByte)):
        if (len(arrayOfByte) > i + 1):
            j = ((int('0xFF',16) & arrayOfByte[(i + 1)]) >> 5 | (int('0xFF',16) & arrayOfByte[(i + 1)]) << 3)
            byteArray.append(j)
            byteArray.append((int('0xFF',16) & arrayOfByte[i]) >> 5 | (int('0xFF',16) & (arrayOfByte[i]) << 3))
        else:
            byteArray.append((int('0xFF',16) & arrayOfByte[i]) >> 5 | (int('0xFF',16) & (arrayOfByte[i]) << 3))

        i += 2

    a = ''.join([ (chr(x & 0xFF)) for x in byteArray])

    if (current not in a):
        b = readString(arrayOfByte, 4)
        if (current not in b):
            pass
        return b
    return a

#EXTRACT
def yvesToHTML(yvesDir):

    global current

    yvesfile = 'manifest.yves'
    
    try:
        with open(yvesfile, 'rb') as json_file:
            bibleMetaData = json.load(json_file)
    except:
        bibleMetaData = json.loads(readFile(yvesfile))

    if (not os.path.isdir(os.path.join(yvesDir,'new'))):
        os.mkdir(os.path.join(yvesDir,'new')) 

    #BODY
    for book in bibleMetaData['books']:

        print(book['human_long'])
        for chapter in book['chapters']:
            current = chapter['usfm']

            fileName = os.path.join(yvesDir,'original',chapter['usfm'])
            if (not os.path.exists(fileName)):
                if ('INTRO' in fileName):
                    print(f'{bcolors.WARNING}error: {fileName} does not exist{bcolors.ENDC}')
                else:
                    print(f'{bcolors.ERROR}error: {fileName} does not exist{bcolors.ENDC}')
                continue

            data = readFile( fileName )
            if not data:
                print(f'error: could not read {fileName}')
                continue

            data = data[:data.rindex('</div>')+6] #remove everything outside of final div
            chapterLines = data.splitlines()

            out = []

            atEnd = False
            for line in chapterLines[2:len(chapterLines)-1]:
                for _hex, _char in LATIN_1_CHARS:
                    line = line.replace(_hex, _char)
                
                out.append(line[6:])
                if (line == '      </div>'):
                    break

            htmlToPlain(out, yvesDir, book['usfm'], chapter['human'])

        # break #just Genesis

    print('DONE')

#SIMPLIFY
def htmlToPlain(data, dir, book, chapter):

    file = f'{book}.{chapter}'

    #STRIP HTML, MAINTAINING PARAGRAPH STRUCTURE
    text = ''
    headers = []
    header = ''

    for i in range(2, len(data)-1):
        cleantext = data[i].strip()

        #footnotes
        note = re.search(re.compile('<span class="note x"><span class="label">#<\/span><span class=" body">([^#]+?)<\/span><\/span>'), cleantext)
        while (note):
            noteContent = cleantext[note.regs[1][0]:note.regs[1][1]]
            cleantext = re.sub(re.compile('<span class="note x"><span class="label">#<\/span><span class=" body">([^#]+?)<\/span><\/span>'), f'[note]{noteContent}[/note]', cleantext, 1) #remove footnotes

            note = re.search(re.compile('<span class="note x"><span class="label">#<\/span><span class=" body">([^#]+?)<\/span><\/span>'), cleantext)

        #div
        para = re.match(re.compile(f'<div class="([^>]+)"><span class="verse v\d+" data-usfm="{book}\.\d+\.\d+"><span class="label">\d+<\/span>'), cleantext)
        if (not para):
            para = re.match(re.compile(f'<div class="([^>]+)"><span class="verse v\d+" data-usfm="{book}\.\d+\.\d+">'), cleantext) 
        if (not para): #heading
            header = '~'
            headers.append(re.sub(re.compile('<[^>]+>'), '', cleantext))
            continue #TODO

        p = para.regs[0][1]
        cleantext = re.sub(re.compile('<div class="([^>]+)">'), '', cleantext[(para.regs[1][1]+2):p] + header + f'[{cleantext[para.regs[1][0]:para.regs[1][1]]}]' + cleantext[p:], 1) #<div class='p'><...>1</>... ==> <...>1</>[p]...
        cleantext = re.sub(re.compile('<\/div>'), '', cleantext)

        #content tags
        cleantext = re.sub(re.compile('<span class="content">'), '', cleantext)

        # #headings
        # cleantext = re.sub(re.compile('<div class="s"><span class="heading">[^>]+<\/span><\/div>'), '', cleantext)
        # if (cleantext == ''):
        #     continue

        if (header):
            header = ''
        if (cleantext != ''):
            text += cleantext

    #SPLIT INTO VERSES
    verses = re.split(re.compile(f'<span class="verse v\d+" data-usfm="{book}\.\d+\.\d+"><span class="label">\d+<\/span>'), text)

    #formatting
    for i in range(1,len(verses)):
        verse = re.sub(re.compile(f'<span class="verse v\d+" data-usfm="{book}\.\d+\.\d+">'), '', verses[i])

        tags = []
        tag = re.search(re.compile('<span class="(.+?)">(.+?)<\/span>'), verse)
        while (tag):
            tagName = verse[tag.regs[1][0]:tag.regs[1][1]]
            tagData = verse[tag.regs[2][0]:tag.regs[2][1]]
            newTag = f'[{tagName}]{tagData}[/{tagName}]'

            if (tagName not in tags):
                tags.append(tagName)

            verse = re.sub(re.compile('<span class="(.+?)">(.+?)<\/span>'), newTag, verse, 1)
            tag = re.search(re.compile('<span class="(.+?)">(.+?)<\/span>'), verse)

        verse = re.sub(re.compile('<\/span>'), '', verse) #remove leftover </span>s
        verse = re.sub(re.compile(' +'), ' ', verse) #enforce single spacing
        for tag in tags:
            verse = re.sub(re.compile(f'\[\/{tag}\] \[{tag}\]'), ' ', verse) #merge
        verses[i] = verse

    #OUT
    header = None
    out = []
    
    for v in range(1, len(verses)):
    
        verse = verses[v]
        inner = []

        wj = False

        temp = verse.split('[') # TODO; handle nested tags, i.e <wj>A <it>B</it> C</wj> =/> <wj>A</wj> <it>B</it> <wj>C</wj>
        i = 1
        for section in temp:
            if (section == ''): #[p]
                continue
            if (section == '~'):
                header = headers[0]
                headers = headers[1:]
                continue

            section = re.sub(re.compile('/.+?]'), '', section)
            formatted = re.match(re.compile('.+?]'), section)
            if (formatted):
                format = section[:formatted.regs[0][1]-1]
                section = section[formatted.regs[0][1]:]
            else:
                format = 'text'

            if ('wj' in format):
                wj = True

            if (format not in ['p', 'pc', 'q1', 'q2', 's']):
                #blank
                if ((section == '' or section == ' ') and (header == None)):
                    continue

                #not wj, but nested within wj (exclude notes)
                if (wj):
                    if (inner != []):
                        if (inner[-1]['content'] != ''):

                            if (('wj' not in format) and (format != 'note')):
                                format += ' wj'
                    
                    if (section[-1] == '"'):
                        wj = False

            if (not header):
                inner.append({'type': format, 'content': section})
            else:
                inner.append({'type': format, 'content': section, 'header': header})
                header = None
            i += 1

        out.append(inner)

    outJSON = json.dumps(out, indent=4)
    with open(f'{dir}/new/{file}','w') as f:
        f.write(outJSON)

    #reformat file (condensed)
    with open(f'{dir}/new/{file}','r') as f:
        temp = f.read()
    temp = re.sub(re.compile('\n            '), ' ', temp)
    temp = re.sub(re.compile('\n        },'), ' },', temp)
    temp = re.sub(re.compile('\n        }'), ' }', temp)
    with open(f'{dir}/new/{file}','w') as f:
        f.write(temp)

## START
if (len(sys.argv) < 2): #check there are 3 arguments: the script, input, output
    print('error: insufficient arguments')
else:
    if (os.path.isdir(os.path.join(sys.argv[1],'original'))):
        yvesToHTML(sys.argv[1])
    else:
        print(f'directory /{sys.argv[1]}/original does not exist')