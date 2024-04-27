import React, { useEffect, useState, forwardRef } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import FileManager from '../../utils/FileManager';
import { locateReferences } from '../../utils/bibleReferences';

import PassageChunk from './PassageChunk';
import Passage from './Passage';

type FootnoteProps = {
    contents: string;
    loadPassage: (usfm: object, isFootnote: boolean, openInNewTab?: boolean) => void;
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
    const fileManager = FileManager.getInstance();

    // format references
    const references = data.map((ref) => {
        if (ref[1]) {

            const refType = (ref[1].book === currentBook) ? 'ref internal' : 'ref external';

            // format passage
            const usfm = {"book": currentBook, "initialChapter": currentChapter};
            const notePassage = (<Passage contents={noteContents} usfm={usfm} ignoreFootnotes translation={translation} />);
            // contents of footnote popover
            return (
                <OverlayTrigger key={ref[0]} trigger={['hover', 'focus']} placement="auto-start" overlay={<InnerPopover id='popover-basic'>{notePassage}</InnerPopover>}>
                    <span className={refType} onMouseEnter={updatePopoverContents} onClick={() => loadPassage(ref[1], true)} onAuxClick={() => loadPassage(ref[1], true, true)}>{ref[0]}</span>
                </OverlayTrigger>
            );

            async function updatePopoverContents(): Promise<any> {

                // TODO; prevent multiple reads of same file
                const usfm = ref[1];
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
