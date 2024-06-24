/**
 * Locate and extract occurrences of the pattern `[GH]\d+` from the given text and provide relevant data.
 *
 * Parameters:
 * @param {string} text The input text containing potential occurrences to locate and extract.
 *
 * @returns {Array<{start: number, end: number, match: boolean | any, text: string}>} An array containing objects with the start and end positions, the match data, and the matched text.
 *
 * @example
 *   - locateOccurrences("This is G123 and H456 in the text") returns:
 *     [
 *       { start: 8, end: 12, match: "G123", text: "G123" },
 *       { start: 17, end: 21, match: "H456", text: "H456" }
 *     ]
 *
 *   - locateOccurrences("No occurrences here.") returns:
 *     [{ start: 0, end: 19, match: false, text: "No occurrences here." }]
 */
export function locateStrongsReferences(text: string): Array<{start: number, end: number, match: boolean | string, text: string}> {
    if (text === '') {
        return [];
    }

    // detect occurrences of [GH]\d+
    const pattern = RegExp(/[GHgh]\d+/g);
    const matches = [];

    for (const match of text.matchAll(pattern)) {
        if (match.index !== undefined) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }
    }

    if (matches.length === 0) {
        return [{
            start: 0,
            end: text.length,
            match: false,
            text,
        }];
    }

    const data: { start: number, end: number, match: boolean | string, text: string }[] = [];
    let i;

    // initial
    if (matches[0].start !== 0) {
        data.push({
            start: 0,
            end: matches[0].start,
            match: false,
            text: text.slice(0, matches[0].start),
        });
    }

    // middle
    for (i = 0; i < matches.length; i++) {
        // occurrence
        const displayText = text.slice(matches[i].start, matches[i].end);

        data.push({
            start: matches[i].start,
            end: matches[i].end,
            match: displayText.toUpperCase(),
            text: displayText,
        });

        // post-occurrence
        if (i < matches.length - 1) {
            if (data[data.length - 1].match === false) { // merge with previous
                data[data.length - 1].text += text.slice(matches[i].end, matches[i + 1].start);
                data[data.length - 1].end = matches[i + 1].start;
            }
            else {
                data.push({
                    start: matches[i].end,
                    end: matches[i + 1].start,
                    match: false,
                    text: text.slice(matches[i].end, matches[i + 1].start),
                });
            }
        }
    }

    // final
    if (matches[i - 1].end !== text.length) { // ending dud
        if (data[data.length - 1].match === false) { // merge with previous
            data[data.length - 1].text += text.slice(matches[i - 1].end, text.length);
            data[data.length - 1].end = text.length;
        }
        else {
            data.push({
                start: matches[i - 1].end,
                end: text.length,
                match: false,
                text: text.slice(matches[i - 1].end, text.length),
            });
        }
    }

    return data;
}
