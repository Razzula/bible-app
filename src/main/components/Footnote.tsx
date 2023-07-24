import React, { useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { getUSFM, locateReferences }  from '../utils/bibleReferences';

import Scripture from './scripture/Scripture';

type Footnote = {
    contents: string;
    loadPassage: Function;
    currentBook: string;
    currentChapter: number;
}

//popover with passage
const InnerPopover = React.forwardRef(
    ({ popper, children, show: _, ...props }: any, ref: any) => {
        React.useEffect(() => {
            popper.scheduleUpdate(); //update positioning
        }, [children, popper]);

        return (
            <Popover ref={ref} body {...props}>
                    {children}
            </Popover>
        );
    },
);

function Footnote({ contents, loadPassage, currentBook, currentChapter }: Footnote) {
    const [noteContents, setNoteContents]: [string|undefined, Function]  = useState();

    const data = locateReferences(contents, currentBook, currentChapter);

    //format references
    const references = data.map((ref) => {
        if (ref[1]) {

            const refType = (ref[1].book === currentBook) ? 'ref internal' : 'ref external';
            
            //format passage
            const notePassage = (<Scripture contents={noteContents} ignoreFootnotes />);
            //contents of footnote popover
            return (
                <OverlayTrigger trigger={['hover', 'focus']} placement="auto-start" overlay={<InnerPopover id='popover-basic'>{notePassage}</InnerPopover>}>
                    <span className={refType} onMouseEnter={updatePopoverContents} onClick={() => loadPassage(ref[1], true)}>{ref[0]}</span>
                </OverlayTrigger>
            );

            async function updatePopoverContents() {
                //TODO; prevent multiple reads of same file
                const usfm = ref[1];
                const fileName = `${usfm.book}.${usfm.initialChapter}`;
                let passageContents = await window.electronAPI.readFile(fileName, "Scripture/NKJV");
                passageContents[0][0].chapter = usfm.initialChapter;

                if (!passageContents) {
                    setNoteContents(null);
                    return;
                }

                //trim to specific verses
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

                passageContents = passageContents.slice(initalVerse-1, finalVerse);
                passageContents[0][0].verse = initalVerse;

                setNoteContents(passageContents);
            }
        }
        return ref;
    });

    //popover with footnote contents
    const footnotePopover = (
        <Popover id="popover-basic">
            <Popover.Body>
                {references}
            </Popover.Body>
        </Popover>
    );
    
    //footnote
    return (
        <OverlayTrigger trigger="click" rootClose placement="top" overlay={footnotePopover}>
            <span className="note"/>
        </OverlayTrigger>
    );

}

export default Footnote;