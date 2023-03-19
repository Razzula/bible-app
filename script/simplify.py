import re
import json

def htmlToPlain(dir, book, chapter):

    file = f'{book}.{chapter}'
    with open(f'{dir}/html/{file}', 'r') as f:
        data = f.readlines() #separated by paragraph

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
    with open(f'{dir}/json/{file}','w') as f:

        out = []
        # f.write('{')
        
        for v in range(1, len(verses)):
        #     f.write(f'\n\t"{v}":"{verses[v]}",')
        
            verse = verses[v]
            inner = []

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

                if (not header):
                    inner.append({'type': format, 'content': section})
                else:
                    inner.append({'type': format, 'content': section, 'header': header})
                    header = None
                i += 1

            out.append(inner)

        # f.write('\n}')

        outJSON = json.dumps(out, indent=4)
        f.write(outJSON)

    #reformat file (condensed)
    with open(f'{dir}/json/{file}','r') as f:
        temp = f.read()
    temp = re.sub(re.compile('\n            '), ' ', temp)
    temp = re.sub(re.compile('\n        },'), ' },', temp)
    temp = re.sub(re.compile('\n        }'), ' }', temp)
    with open(f'{dir}/json/{file}','w') as f:
        f.write(temp)

htmlToPlain('NKJV', 'GEN', '1')
htmlToPlain('NKJV', 'GEN', '2')
htmlToPlain('NKJV', 'MAT', '5')
print('done')