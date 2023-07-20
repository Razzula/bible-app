import books from '../../../public/books.json';
const booksArray: any = books;

export function getUSFM(reference: string) {

    const match = /((?:[123]+ ?)?[A-Za-z]+)\.?\s*(\d+)(?::\s*(\d+)(?:\s*-(\d+))?|-(\d+))?/.exec(reference.toUpperCase())

    if (!match) { //invalid format
        return null;
    }

    const usfm: any = {};
    match[1] = match[1].replace(/\s+/, '');
    booksArray.forEach((book: string[]) => {
        if (book.includes(match[1])) {
            // console.log(book);
            usfm.book = book[0];
        }
    });

    usfm.initialChapter = match[2];
    usfm.initialVerse =  Number(match[3]);
    usfm.finalVerse = Number(match[4]);
    usfm.finalChapter = Number(match[5]);

    // console.log(usfm);
    return usfm;
}