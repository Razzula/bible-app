import React, { useEffect, useRef } from 'react';

import Footnote from './Footnote';

import '../../styles/Bible.scss';
import { InlineAnchor } from 'sidenotes';
import { isOfParagraphType } from '../../utils/general';

type PassageChunkProps = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
    translation: string;
    passageNotes?: any;
    renderMode?: string;
    selectedToken?: string;
    handleTokenSelected?: Function;
}

type PassageTokenProps = {
    content: Section;
    classes: string[];
    selectedToken?: string;
    handleTokenSelected?: Function;
}

type Section = {
    id: string;
    type: string;
    content: string;
    children?: any; //TODO
    token?: string;
}

/**
 * TODO
 */
function PassageChunk({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, passageNotes, selectedToken, handleTokenSelected, renderMode }: PassageChunkProps): JSX.Element {

    const [notedVerses, setNotedVerses]: [Set<string> | undefined, Function] = React.useState();

    useEffect(() => {
        if (passageNotes) {
            const notedVerses = new Set<string>();
            passageNotes.forEach((note: any) => {
                notedVerses.add(note.verse);
            });
            setNotedVerses(notedVerses);
        }
    }, [passageNotes]);

    // format paragraphs
    /**
     * Maps a single array of formatted scripture to JSX elements.
     */
    function generateContents(item: Section): JSX.Element | JSX.Element[] | null {

        // footnotes
        if (item.type === 'note') {
            if (ignoreFootnotes) {
                return null;
            }

            return (
                <Footnote contents={item.content} loadPassage={loadPassage} currentBook={passageBook ?? ''} currentChapter={passageChapter ?? 0} translation={translation} />
            );
        }

        const elements: JSX.Element[] = [];

        if (item.type) {

            // paragraph
            if (isOfParagraphType(item.type, true)) {
                elements.push(<br />); // TODO this means that headers are spaced, even when disabled
            }

            // labels
            if (item.type.includes('label chapter')) {
                elements.push(
                    <span className={item.type} id={'v1'}>{item.content}</span> // can use scrollIntoView() to jump to verse
                );
                return elements;
            }
            if (item.type.includes('label')) {
                elements.push(
                    <span className={item.type} id={`v${item.content}`}>{item.content}</span> // can use scrollIntoView() to jump to verse
                );
                return elements;
            }
        }

        // other formatting
        let contents;
        const classes: string[] = [item.id];
        if (item.type !== undefined) {
            classes.push(item.type);
        }
        if (item.token !== undefined || true) { // TODO only do this for valid tokens
            classes.push('text');
        }

        if (item.children) { // if node is a parent, recursively generate its contents
            contents = <span className={classes.join(' ')}>{item.children.map(generateContents)}</span>; //TODO; precent undefined type
        }
        else {
            contents = <PassageToken
                content={item} classes={classes} selectedToken={selectedToken}
                handleTokenSelected={handleTokenSelected}
            />;
        }

        // anchors
        if (notedVerses !== undefined && notedVerses?.has(item.id) && renderMode === 'sidenotes') {
            elements.push(
                <InlineAnchor sidenote={item.id}>{contents}</InlineAnchor>
            );
        }
        else {
            elements.push(contents);
        }

        return elements;
    }

    return contents.map(generateContents);

}

function PassageToken({ content, classes, selectedToken, handleTokenSelected }: PassageTokenProps): JSX.Element {

    const tokenRef = useRef(null);

    const handleTokenClick = (e: React.MouseEvent) => { // TODO same, but for mouseEnter/Leave
        if (handleTokenSelected) {
            if (selectedToken === content.id) {
                handleTokenSelected(undefined, null);
            }
            else {
                handleTokenSelected(content.id, tokenRef.current);
            }
        }
    };

    return (
        <span ref={tokenRef}
            className={classes.join(' ') + ((selectedToken && selectedToken === content.id) ? ' selected' : '')}
            onClick={handleTokenClick}
        >
            {content.content /* TODO this is poorly named */}
        </span>
    );
}

export default PassageChunk;
