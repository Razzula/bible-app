import React from 'react';

import Footnote from './Footnote';

import '../../styles/bible.scss';
import { InlineAnchor } from 'sidenotes';

type PassageChunkProps = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
    translation: string;
    notedVerses?: Set<string>;
    setSelectedVerse: Function;
}

type Verse = {
    id: string,
    type: string,
    content: string,
    children?: any //TODO
}

/**
 * TODO
 */
function PassageChunk({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, notedVerses, setSelectedVerse }: PassageChunkProps): JSX.Element {

    // format paragraphs
    function generateContents(item: Verse): JSX.Element | null {
        // footnotes
        if (item.type === 'note') {
            if (ignoreFootnotes) {
                return null;
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
        let className = (item.type !== undefined) && !(item.type.includes('p') || item.type.includes('q1') || item.type.includes('q2') || item.type.includes('pc') || item.type.includes('qs')) // not a paragraph
            ? `${item.type} ${item.id}` : item.id;

        if (item.children) { // if node is a parent, recursively generate its contents
            contents = <span className={className}>{item.children.map(generateContents)}</span>; //TODO; precent undefined type
        }
        else {
            contents = <span className={className} onMouseDown={() => {setSelectedVerse(item.id)}} onMouseUp={() => setSelectedVerse(item.id)}>{item.content}</span>
        }

        // anchors
        if (notedVerses !== undefined && notedVerses?.has(item.id)) {
            return (
                <InlineAnchor sidenote={item.id}>{contents}</InlineAnchor>
            );
        }
        else {
            return contents;
        }
    }

    return contents.map((paragraph: Array<Verse>) => {

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
                <br />
            </>
        );
    });

}

export default PassageChunk;