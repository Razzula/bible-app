import os
import json
import re
import time

import requests
from bs4 import BeautifulSoup
import unicodedata

root = os.path.dirname(__file__)

with open(os.path.join(root, '..', 'public', 'manifest.json'), 'r') as f:
    manifest = json.load(f)

startTime = time.time()

for book in manifest:

    if (book['usfm'] == 'SNG'):
        bookName = 'songs'
    else:
        if (book.get('full-title')):
            bookName = str.lower(book['full-title'])
            # de-numericalise
            bookName = bookName.replace('iii ', '3_')
            bookName = bookName.replace('ii ', '2_')
            bookName = bookName.replace('i ', '1_')
        else:
            bookName = str.lower(book["title"])

    print(book['usfm'])

    for chapter, verseCount in enumerate(book['chapters']):
        chapterData = {}

        for verse in range(verseCount):
            verseData = {}

            url = f'https://biblehub.com/interlinear/{bookName}/{chapter+1}-{verse+1}.htm'
            # note: we could do the whole chapter at once which would reduce requests and improve performance
            # there is no easy way to distinguish between the different verses in the chapter, though

            # GET webpage
            response = requests.get(url)

            # PARSE
            soup = BeautifulSoup(response.text, 'html.parser')

            # tables
            root = soup.find('div', {'class': 'padleft'})

            tables = root.find_all('table')
            tokenCount = 0
            for table in tables:

                token = {}

                cells = table.find_all('span')
                for cell in cells:

                    for cellClass in cell.attrs.get('class'):
                        if (cellClass == 'pos'): # Hebrew --> Greek
                            cellClass = 'strongs'

                        if (cellClass in ['strongs', 'eng']): # translit, greek # additional fields with the original language contents
                            data = cell.text.strip()

                            data = unicodedata.normalize('NFKD', data)

                            if (data != '[e]'):
                                token[cellClass] = data
                
                if (token.get('strongs') or token.get('pos')):
                    # print(token)
                    verseData[str(tokenCount)] = token
                    tokenCount += 1

            # handle verseData
            chapterData[verse + 1] = verseData

            pass # verse
            # break

        # output
        outJSON = json.dumps(chapterData, indent=4)
        outDir = os.path.join(os.path.dirname(__file__), 'data', 'strongs', f'{book["usfm"]}.{chapter + 1}.json')
        with open(outDir, 'w') as f:
            f.write(outJSON)

        # reformat file (condensed)
        with open(outDir, 'r') as f:
            temp = f.read()
        temp = re.sub(re.compile(r'\n            '), ' ', temp)
        temp = re.sub(re.compile(r'\n        },'), ' },', temp)
        with open(outDir, 'w') as f:    
            f.write(temp)

        print(f'\t{chapter+1}')
        pass # chapter
        # break

    pass # book
    # break

print('done :D')

timeTaken = time.time() - startTime
if (timeTaken > 3600):
    print(f'--- {timeTaken / 3600} hours ---')
elif (timeTaken > 60):
    print(f'--- {timeTaken / 60} minutes ---')
else:
    print(f'--- {timeTaken} seconds ---')
