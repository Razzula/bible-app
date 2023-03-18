import sys, os, json

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

def loadJson(string):
    return json.loads(string)

def yvesDir2HTML(yvesfile, yvesDir):

    global current

    yvesfile = f'{yvesDir}/original/{yvesfile}'
    
    try:
        with open(yvesfile, 'rb') as json_file:
            bibleMetaData = json.load(json_file)
    except:
        bibleMetaData = loadJson(readFile(yvesfile))

    bibleName = bibleMetaData['abbreviation'] + ".html"

    # with open(bibleName, 'w') as f:
    #     #HEAD
    #     f.write('<html dir="' + bibleMetaData['language']['text_direction'] + '"><head><title>')
    #     f.write(bibleMetaData['local_title'])
    #     f.write('</title>\n')

    #     f.write('<meta name="Source" content="YouVersion">\n')
    #     f.write('<style type="text/css">')
    #     f.write('</style>')
    #     f.write('</head><body>\n')

    #BODY
    for book in bibleMetaData['books']:

            # f.write( '<html><body>\n')
            # f.write('<div class="book">\n<div class="bookTitle">')
            # f.write(book['human_long'])
            # f.write('</div>\n')
        print(book['human_long'])
        for chapter in book['chapters']:
            with open(yvesDir+'/html/'+chapter['usfm'], 'w', encoding='utf-8') as f:
                current = chapter['usfm']

                # try:
                #     data = readFile( os.path.join(yvesDir,'original',book['usfm'],chapterFile + ".yves") )
                # except:
                    #data = json.loads(readFile( os.path.join(yvesDir,'original',chapter['usfm']) ))['content']

                data = readFile( os.path.join(yvesDir,'original',chapter['usfm']) )
                    
                if not data:
                    continue

                data = data[:data.rindex('</div>')+6] #remove everything outside of final div
                chapterLines = data.splitlines()

                atEnd = False
                for line in chapterLines[2:len(chapterLines)-1]:
                    for _hex, _char in LATIN_1_CHARS:
                        line = line.replace(_hex, _char)

                    # if chapter['usfm']=='PSA.119': #hebrew alphabet
                    #     line = line.encode('ascii', errors='ignore')
                    #     line = line.decode('ascii', errors='ignore')
                    
                    try:
                        f.write(line[6:])

                        if (line == '      </div>'):
                            atEnd = True
                        else:
                            f.write('\n')

                    except:
                        pass #this will catch encoding errors when not using utf-8

                    if (atEnd):
                        break


            # f.write('</div>\n')
            # f.write( '</body></html>\n')
            #break #useful for just INTROs
        #break #just Genesis

    return 'done'

print(yvesDir2HTML("manifest.yves","NKJV"))