import React, { useEffect, useState, forwardRef } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import FileManager from '../../utils/FileManager';
import { locateReferences } from '../../utils/bibleReferences';

import PassageChunk from './PassageChunk';
import Passage from './Passage';

import licenses from '../../../../public/licenses.json';

type FootnoteProps = {
    contents: string;
    loadPassage: (usfm: object, isFootnote: boolean, openInNewTab?: boolean) => void;
    currentBook: string;
    currentChapter: number;
    translation: string;
}

type ReferenceProps = {
    text: string;
    usfm: any;
    loadPassage: (usfm: object, isFootnote: boolean, openInNewTab?: boolean) => void;
    currentBook: string;
    translation: string;
}

// popover with passage
const InnerPopover = forwardRef(
    ({ popper, children, show: _, ...props }: any, ref: any) => {
        useEffect(() => {
            popper.scheduleUpdate(); // update positioning
        }, [children, popper]);

        return (
            <Popover ref={ref} body {...props}>
                {children}
            </Popover>
        );
    },
);

/**
 * A React component to display footnotes.
 *
 * @param {FootnoteContentProps} props - The properties passed to the component.
 *  - contents (string): The contents of the footnote.
 *  - loadPassage (Function): A function to load a passage.
 *  - currentBook (string): The current book.
 *  - currentChapter (number): The current chapter.
 *
 * @returns {JSX.Element} A JSX Element of a `span` containing the footnote.
 *
 * @note
 *   - References are automatically formatted and linked to the appropriate passage.
 *   - Hovering over a reference will display the passage in a popover.
 */
function Footnote({ contents, loadPassage, currentBook, currentChapter, translation }: FootnoteProps): JSX.Element {

    const data = locateReferences(contents, currentBook, currentChapter);

    // format references
    const references = data.map((reference) => {
        if (reference.usfm) {
            return <BibleReference text={reference.text} usfm={reference.usfm} currentBook={currentBook} translation={translation} loadPassage={loadPassage} />
        }
        return reference.text;
    });

    // popover with footnote contents
    const footnotePopover = (
        <Popover id="popover-basic">
            <Popover.Body>
                {references}
            </Popover.Body>
        </Popover>
    );

    // footnote
    return (
        <OverlayTrigger trigger="click" rootClose placement="top" overlay={footnotePopover}>
            <span className="note" />
        </OverlayTrigger>
    );

}

export function BibleReference({ text, usfm, currentBook, translation, loadPassage }: ReferenceProps) {

    const [noteContents, setNoteContents]: [string | undefined, Function] = useState();
    const fileManager = FileManager.getInstance();

    const refType = (usfm.book === currentBook) ? 'ref internal' : 'ref external';

    function handleClick(event: React.MouseEvent, usfm: any, isFootnote: boolean, openInNewTab?: boolean) {
        event.stopPropagation();
        loadPassage(usfm, isFootnote, openInNewTab);
    }

    // contents of footnote popover
    const temp = (
        <OverlayTrigger key={text} trigger={['hover', 'focus']} placement="auto-start"
            overlay={
                <InnerPopover id='popover-basic'>
                    <Passage contents={noteContents} usfm={usfm} ignoreFootnotes translation={translation} />
                    <p className="notice">{(licenses as any)[translation] ?? licenses.PUBLIC_DOMAIN}</p>
                    {/* TODO: (BIBLE-157) use manifest (defaulting to public domain is bad) */}
                </InnerPopover>
            }
        >
            <span
                className={refType}
                onMouseEnter={updatePopoverContents}
                onClick={(e) => handleClick(e, usfm, true)}
                onAuxClick={(e) => handleClick(e, usfm, true, true)}
            >
                {text}
            </span>
        </OverlayTrigger>
    );
    return temp;

    async function updatePopoverContents(): Promise<any> {

        // TODO: only load if different to currently-loaded passage(s)
        const passageContents = await fileManager.loadScripture(usfm.book, usfm.initialChapter, translation);

        if (!passageContents) {
            setNoteContents(null);
            return;
        }

        // trim to specific verses
        let initalVerse = 1, finalVerse = passageContents.length

        if (usfm.initialVerse) {
            initalVerse = usfm.initialVerse;

            if (usfm.finalVerse) {
                finalVerse = usfm.finalVerse;
            }
            else {
                finalVerse = initalVerse;
            }
        }

        const slicedPassageContents: any = {};
        for (let i = initalVerse; i <= finalVerse; i++) {
            slicedPassageContents[i] = passageContents[i];
        }
        slicedPassageContents[initalVerse][0].verse = initalVerse;

        setNoteContents([slicedPassageContents]);
    }
}

export default Footnote;
