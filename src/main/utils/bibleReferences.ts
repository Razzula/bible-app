import books from '../../../public/books.json';
const booksArray: any = books;

/**
 * Parse the given reference and return relevant USFM (Unified Standard Format Marker).
 *
 * @param {string} reference The USFM reference to parse.
 * @param {string | null} currentBook The current book name. If not provided, the function assumes insufficient context.
 * @param {number} currentChapter The current chapter number. If not provided, the function assumes insufficient context.
 *
 * @returns {Array<any>} An array of objects representing the parsed data.
 *
 * @typedef {Object} ReferenceData
 * @property {string} book - The book identifier extracted from the reference.
 * @property {number} initialChapter - The initial chapter number extracted from the reference.
 * @property {number} initialVerse - The initial verse number extracted from the reference.
 * @property {number|undefined} [finalChapter] - The final chapter number extracted from the reference (optional).
 * @property {number|undefined} [finalVerse] - The final verse number extracted from the reference (optional).
 *
 * @note
 *   - The reference can be in various formats, accepting both full and shorthand.
 *   - 'currentBook' and 'currentChapter' can be explicitly provided; these are used for shorthands.
 *   - The function handles Roman numerals in the book reference, such as "III John 3:16".
 *   - The 'usfm' object is returned as an array of objects to handle multiple references separated by commas or semicolons.
 *
 * @example
 *   - getUSFM("John 3:16-17") returns:
 *     [{ book: "JHN", initialChapter: 3, initialVerse: 16, finalVerse: 17 }]
 *
 *   - getUSFM("Gen 1:2; 2:1-3") returns:
 *     [{ book: "GEN", initialChapter: 1, initialVerse: 2 }, { book: "GEN", initialChapter: 2, initialVerse: 1, finalVerse: 3 }]
 *
 *   - getUSFM("3:16", "JHN", 2) returns:
 *     [{ book: "JHN", initialChapter: 3, initialVerse: 16 }]
 */
export function getUSFM(reference: string, currentBook: string | null = null, currentChapter = NaN): Array<any> {

    let match = /(I+ |[123]+)? ?([A-Za-z]+)\.? *(\d+)(?::\s*(\d+)(?:\s*-\s*(\d+))?|-(\d+))?(?:.*?([;,].*))?/.exec(reference.toUpperCase())
    /**
     * 1: book number (optional)               III     
     * 2: book name                            John    Genesis
     * 3: initial chapter                      3       1
     *                                         :
     * 4: initial verse (optional)             16
     *                                         -       -
     * 5: final verse (optional)               17      2
     * 6: final chapter (optional)
     * 7: additional references (optional)
     */

   const usfm: any = {};

    if (match) {

        if (match[2] === 'V' || match[2] === 'VERSE') { // VERSE REFERENCE

            if (currentBook === null || currentChapter === null) { // insufficient context
                return [];
            }

            usfm.book = currentBook;
            usfm.initialChapter = currentChapter;
            usfm.initialVerse =  Number(match[3]);
            usfm.finalVerse = Number(match[6]);
        }
        else {

            if (match[2] === 'CH' || match[2] === 'CHAPTER') { // CHAPTER REFERENCE

                if (currentBook === null) { // insufficient context
                    return [];
                }

                usfm.book = currentBook;
            }
            else { // FULL REFERENCE

                // book name
                if (match[1] === undefined) {
                    match[1] = '';
                }
                else {
                    // account for Roman numerals
                    if (match[1].startsWith('I')) {
                        match[1] = String(match[1].length - 1);
                    }
                }
                const bookName = match[1] + match[2];
            
                booksArray.forEach((book: string[]) => {
                    if (book.includes(bookName)) {
                        usfm.book = book[0];
                    }
                });
            }

            // chapters, verses
            usfm.initialChapter = Number(match[3]);
            usfm.initialVerse =  Number(match[4]);
            usfm.finalVerse = Number(match[5]);
            usfm.finalChapter = Number(match[6]);
        }
        
    }
    else { // invalid format (may be shorthand reference)

        if (currentBook === null) { // insufficient context
            console.log('sdfuhsdfsdfsdfsfsdf')
            return [];
        }

        match = /(?:(\d+):)?(\d+)(?:-(\d+))?/.exec(reference.toUpperCase())
        if (!match) { // invalid format
            return [];
        }
        usfm.book = currentBook;

        // chapters, verses
        usfm.initialChapter = Number(match[1]) || currentChapter;
        usfm.initialVerse =  Number(match[2]);
        usfm.finalVerse = Number(match[3]);
    } 

    if (match[7] === undefined) {
        return [usfm];
    }
    else { // additional references
        const additionalReferences = getUSFM(match[7], usfm.book, usfm.initialChapter);
        console.log(additionalReferences)
        return [usfm, ...additionalReferences];
    }
}

/**
 * Locate and extract references from the given text and provide relevant data.
 *
 * Parameters:
 * @param {string} text (The input text containing potential references to locate and extract.
 * @param {string | null} currentBook The current book name. If not provided, the function assumes insufficient context.
 * @param {number} currentChapter The current chapter number. If not provided, the function assumes insufficient context.
 *
 * @returns {Array<[string, boolean | any]>} An array containing pairs of [text, referenceData].
 *
 * @note
 *   - The function uses a regular expression to detect references within the input text.
 *   - The 'getUSFM' function is used to extract reference data from the matched references.
 *
 * @example
 *   - locateReferences("See John 3:16; Genesis 1:1") returns:
 *     [
 *       ["See ", false],
 *       ["John 3:16", { book: "JHN", initialChapter: 3, initialVerse: 16 }],
 *       ["; ", false],
 *       ["Genesis 1:1", { book: "GEN", initialChapter: 1, initialVerse: 1 }]
 *     ]
 *
 *   - locateReferences("No references here.") returns:
 *     [["No references here.", false]]
 */
export function locateReferences(text: string, currentBook: string | null = null, currentChapter = NaN) {

    if (text === '') {
        return [];
    }

    // detect references
    const pattern = RegExp(/(?:(?:I+ |[123]+ ?)?(?:[A-Za-z]+)\.? *|(?<=([;,])) ?)\d+(?::\s*\d+(?:\s*-\s*\d+)?|-\d+)?/g); // TODO
    const matches = [];

    for (const match of text.matchAll(pattern)) { // get positions of references
        if (match.index !== undefined) {
            matches.push([match.index, match.index + match[0].length]);
        }
    }

    if (matches.length === 0) {
        return [[text, false]];
    }

    const data = [];

    // extract references
    let i;

    // initial
    if (matches[0][0] !== 0) {
        data.push([text.slice(0, matches[0][0]), false]);
    }
    // middle
    for (i = 0; i < matches.length; i++) {

        // reference
        const displayText = text.slice(matches[i][0], matches[i][1]);
        const usfm = getUSFM(displayText, currentBook, currentChapter);
        data.push([displayText, usfm[0]]); // reference

        if (usfm[0].book !== undefined) {
            currentBook = usfm[0].book;
        }
        if (usfm[0].initialChapter !== undefined) {    
            currentChapter = usfm[0].initialChapter;
        }

        // post-reference
        if (i < matches.length-1) { 
            data.push([text.slice(matches[i][1], matches[i+1][0]), false]);
        }
        
    }
    // final
    if (matches[i-1][1] !== text.length) { // ending dud 
        data.push([text.slice(matches[i-1][1], text.length), false]);
    }

    return data;

}