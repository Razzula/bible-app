import React from 'react';

import Footnote from './Footnote';

import '../../styles/bible.scss';
import { InlineAnchor } from 'sidenotes';

type PassageChunk = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
    translation: string;
    notedVerses?: Set<string>;
}

/**
 * TODO
 */
function PassageChunk({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, notedVerses }: PassageChunk) {

    // format paragraphs
    function generateContents(item: any) {
        // footnotes
        if (item.type === 'note') {
            if (ignoreFootnotes) {
                return;
            }

            return (
                <Footnote contents={item.content} loadPassage={loadPassage} currentBook={passageBook ?? ''} currentChapter={passageChapter ?? 0} translation={translation} />
            );
        }

        // labels
        if (item.type === 'label') {
            return (
                <span className={item.type} id={`v${item.content}`}>{item.content}</span> // can use scrollIntoView() to jump to verse
            );
        }
        if (item.type === 'label chapter') {
            return (
                <span className={item.type} id={'v1'}>{item.content}</span> // can use scrollIntoView() to jump to verse
            );
        }

        // other formatting
        let contents;
        if (item.children) { // if node is a parent, recursively generate its contents
            contents = <span className={`${item.type} ${item.test}`}>{item.children.map(generateContents)}</span>; //TODO; precent undefined type
        }
        else {
            contents = <span className={`${item.type} ${item.test}`}>{item.content}</span>
        }
            
        // anchors
        if (notedVerses !== undefined && notedVerses?.has(item.test)) {
            return (
                <InlineAnchor sidenote={item.test}>{contents}</InlineAnchor>
            );
        }
        else {
            return contents;
        }
    }

    return contents.map((paragraph: Array<{type:string, content:string, test:string}>) => {

        // format contents of paragraph
        const paraContent = paragraph.map(generateContents);

        let paraType = paragraph[0].type
        if (paraType.startsWith('label')) {
            paraType = paragraph[1].type
        }

        return (
            <>
                <span className={paraType}>
                    {paraContent}
                </span>
                <br/>
            </>
        );
    });

}

export default PassageChunk;