import React, { useEffect, useRef } from 'react';

import Footnote from './Footnote';

import '../../styles/Bible.scss';
import { InlineAnchor, Store } from 'sidenotes';
import { isOfParagraphType, isOfHeaderType } from '../../utils/general';
import { useSelector, useStore } from 'react-redux';
import { RootState } from '../../redux/rootReducer';
import { selectSidenote } from 'sidenotes/dist/src/store/ui/actions';

type PassageChunkProps = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
    translation: string;
    passageNotes?: any;
    renderMode?: string;
    handleTokenSelected?: Function;
}

type PassageTokenProps = {
    content: Section;
    classes: string[];
    topNoteID?: string;
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
function PassageChunk({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, passageNotes, handleTokenSelected, renderMode }: PassageChunkProps): JSX.Element {

    const [notedTokens, setNotedTokens]: [any, Function] = React.useState();

    useEffect(() => {
        if (passageNotes) {
            const newNotedVerses: any = {};
            passageNotes.forEach((note: any) => {
                note.tokens.forEach((token: string) => {
                    const currentForToken = newNotedVerses[token];
                    if (currentForToken === undefined) {
                        newNotedVerses[token] = new Set([note.id]);
                    }
                    else {
                        currentForToken.add(note.id);
                        newNotedVerses[token] = currentForToken;
                    }
                });
            });
            setNotedTokens(newNotedVerses);
        }
    }, [passageNotes]);

    // format paragraphs
    /**
     * Maps a single array of formatted scripture to JSX elements.
     */
    function generateContents(item: Section): JSX.Element | JSX.Element[] | null {

        if (item.token === undefined) {
            item.token = item.id; //TODO TEMP!
        }

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

            // header
            if (isOfHeaderType(item.type)) {
                elements.push(<br className={item.type}/>);
                elements.push(
                    <span className={item.type}>{item.content}</span>
                );
                return elements;
            }
            // paragraph
            if (isOfParagraphType(item.type)) {
                elements.push(<br />);
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

        const notesForThisToken: Set<string> = notedTokens ? notedTokens[item.token] : undefined;

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
            const topNoteID = notesForThisToken?.size > 0 ? notesForThisToken.values().next().value : undefined;

            contents = <PassageToken
                content={item} classes={classes}
                topNoteID={topNoteID}
                handleTokenSelected={handleTokenSelected}
            />;
        }

        // anchors
        if (notesForThisToken && item.token !== undefined && renderMode === 'sidenotes') {

            let tempChild = contents;
            if (notesForThisToken !== undefined) {
                notesForThisToken.forEach((noteID: string) => {
                    const tempParent = <InlineAnchor sidenote={noteID}>{tempChild}</InlineAnchor>;
                    tempChild = tempParent;
                });
            }
            elements.push(tempChild)
        }
        else {
            elements.push(contents);
        }

        return elements;
    }

    return contents.map(generateContents);

}

function PassageToken({ content, classes, topNoteID, handleTokenSelected }: PassageTokenProps): JSX.Element {

    const tokenRef = useRef(null);

    const selectedToken = useSelector((state: RootState) => state.passage.activeToken);
    const store: Store = useStore();

    const handleTokenClick = (event: React.MouseEvent) => { // TODO same, but for mouseEnter/Leave
        if (handleTokenSelected) {
            event.stopPropagation();

            if (selectedToken === content.id) {
                handleTokenSelected(undefined, null);
            }
            else {
                handleTokenSelected(content.id, tokenRef.current);
            }
        }
        if (topNoteID) {
            event.stopPropagation();
        }
        store.dispatch(selectSidenote('Scripture', topNoteID));
    };

    const selectionCSS = (selectedToken && selectedToken !== content.id) ? ' unselected' : '';

    return (
        <span ref={tokenRef}
            className={classes.join(' ') + selectionCSS}
            onClick={handleTokenClick}
        >
            {content.content /* TODO this is poorly named */}
        </span>
    );
}

export default PassageChunk;
