import React, { useEffect, useState, forwardRef } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { locateReferences } from '../../utils/bibleReferences';

import Passage from './Passage';

type FootnoteProps = {
    contents: string;
    loadPassage: (usfm: any, isFootnote: boolean) => void;
    currentBook: string;
    currentChapter: number;
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
    const [noteContents, setNoteContents]: [string | undefined, Function] = useState();

    const data = locateReferences(contents, currentBook, currentChapter);

    // format references
    const references = data.map((ref) => {
        if (ref[1]) {

            const refType = (ref[1].book === currentBook) ? 'ref internal' : 'ref external';

            // format passage
            const notePassage = (<Passage contents={noteContents} ignoreFootnotes translation={translation} />);
            // contents of footnote popover
            return (
                <OverlayTrigger key={ref[0]} trigger={['hover', 'focus']} placement="auto-start" overlay={<InnerPopover id='popover-basic'>{notePassage}</InnerPopover>}>
                    <span className={refType} onMouseEnter={updatePopoverContents} onClick={() => loadPassage(ref[1], true)}>{ref[0]}</span>
                </OverlayTrigger>
            );

            async function updatePopoverContents(): Promise<any> {
                // TODO; prevent multiple reads of same file
                const usfm = ref[1];
                const fileName = `${usfm.book}.${usfm.initialChapter}`;
                let passageContents = await window.electronAPI.loadScripture(fileName, translation);
                passageContents[0][0].chapter = usfm.initialChapter;

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

                passageContents = passageContents.slice(initalVerse - 1, finalVerse);
                passageContents[0][0].verse = initalVerse;

                setNoteContents(passageContents);
            }
        }
        return ref;
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

export default Footnote;