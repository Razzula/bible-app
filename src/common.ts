const books = require('./books.json');

export function getUSFM(reference: string) {

    const match = reference.toUpperCase().match(/((?:[123]+ ?)?[A-z]+)\.?\s*(\d+)(?::\s*(\d+)(?:\s*-(\d+))?|-(\d+))?/); //NOT GLOBAL
    // console.log(match);

    if (!match) { //invalid format
        return null;
    }

    let usfm: any = {};
    match[1] = match[1].replace(/\s+/, '');
    books.forEach((book: (string[])) => {
        if (book.includes(match[1])) {
            // console.log(book);
            usfm['book'] = book[0];
        }
    });

    usfm['initialChapter'] = match[2];
    usfm['initialVerse'] =  Number(match[3]);
    usfm['finalVerse'] = Number(match[4]);
    usfm['finalChapter'] = Number(match[5]);

    // console.log(usfm);
    return usfm;
}