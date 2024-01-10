import React from 'react';

import Footnote from './Footnote';

import '../../styles/bible.scss';
import { InlineAnchor } from 'sidenotes';
import { isOfParagraphType } from '../../utils/general';
import { allowedNodeEnvironmentFlags } from 'process';

type PassageChunkProps = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
    translation: string;
    notedVerses?: Set<string>;
    setSelectedVerse: Function;
    renderMode?: string;
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
function PassageChunk({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, notedVerses, setSelectedVerse, renderMode }: PassageChunkProps): JSX.Element {

    // format paragraphs
    function generateContents(item: Verse): JSX.Element | JSX.Element[] | null {
        // footnotes
        if (item.type === 'note') {
            if (ignoreFootnotes) {
                return null;
            }

            return (
                <Footnote contents={item.content} loadPassage={loadPassage} currentBook={passageBook ?? ''} currentChapter={passageChapter ?? 0} translation={translation} />
            );
        }

        let data = [];

        // paragraph
        if (item.type) {
            console.log(item);
            if (isOfParagraphType(item.type, true)) {
                data.push(<br />);
            }
        }

        // labels
        if (item.type === 'label') {
            data.push(
                <span className={item.type} id={`v${item.content}`}>{item.content}</span> // can use scrollIntoView() to jump to verse
            );
            return data;
        }
        if (item.type === 'label chapter') {
            data.push(
                <span className={item.type} id={'v1'}>{item.content}</span> // can use scrollIntoView() to jump to verse
            );
            return data;
        }

        // other formatting
        let contents;
        let className = (item.type !== undefined) ? `${item.type} ${item.id}` : item.id;

        if (item.children) { // if node is a parent, recursively generate its contents
            contents = <span className={className}>{item.children.map(generateContents)}</span>; //TODO; precent undefined type
        }
        else {
            contents = <span className={className} onMouseDown={() => {setSelectedVerse(item.id)}} onMouseUp={() => setSelectedVerse(item.id)}>{item.content}</span>
        }

        // anchors
        if (notedVerses !== undefined && notedVerses?.has(item.id) && renderMode === 'sidenotes') {
            data.push(
                <InlineAnchor sidenote={item.id}>{contents}</InlineAnchor>
            );
        }
        else {
            data.push(contents);
        }

        return data;
    }

    return contents.map(generateContents);

    // return contents.map((paragraph: Array<Verse>) => {

    //     // format contents of paragraph
    //     const paraContent = paragraph.map(generateContents);

    //     // TODO what does this do?
    //     let paraType = paragraph[0].type
    //     if (paraType.startsWith('label')) {
    //         paraType = paragraph[1].type
    //     }

    //     return paraContent;

    //     // return (
    //     //     <div className="passageChunk">
    //     //         <span className={paraType}>
    //     //             {paraContent}
    //     //         </span>
    //     //         <br />
    //     //     </div>
    //     // );
    // });

}

export default PassageChunk;