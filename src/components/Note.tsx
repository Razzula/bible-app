import React, { useState } from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { getUSFM }  from '../common';

import Scripture from './Scripture';

type Note = {
    contents: string;
    loadPassage: any;
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

function Note({ contents, loadPassage }: Note) {
    const [noteContents, setNoteContents]: [any, any]  = useState();

    //detect references
    const pattern = RegExp(/((?:[123]+ )?[A-z]+)\.?\s*(\d+)(?::\s*(\d+)(?:\s*-(\d+))?)?/g);
    let match;
    let matches = new Array();

    while ((match = pattern.exec(contents)) !== null) { //get positions of references
        matches.push([match.index, pattern.lastIndex]);
    }

    let data = new Array();

    //extract references
    let i;

    if (matches[0][0] != 0) { //prevent pushing ''  
        data.push([contents.slice(0, matches[0][0]), false]);
    }
    for (i= 0; i < matches.length; i++) {

        data.push([contents.slice(matches[i][0], matches[i][1]), true]); //reference

        if (i < matches.length-1) { 
            data.push([contents.slice(matches[i][1], matches[i+1][0]), false]); //post-reference
        }
        
    }
    if (matches[i-1][1] != contents.length) { //prevent pushing ''  
        data.push([contents.slice(matches[i-1][1], contents.length), false]);
    }

    //format references
    const references = data.map((ref) => {
        if (ref[1]) {
            
            //format passage
            const notePassage = (<Scripture contents={noteContents} ignoreFootnotes />);
            //contents of footnote popover
            return (
                <>
                <OverlayTrigger trigger={['hover', 'focus']} placement="auto-start" overlay={<InnerPopover id='popover-basic'>{notePassage}</InnerPopover>}>
                    <span className='ref external' onMouseEnter={updatePopoverContents} onClick={() => loadPassage(ref[0])}>{ref[0]}</span>
                </OverlayTrigger>
                </>
            );

            async function updatePopoverContents() {
                //TODO; prevent multiple reads of same file
                let usfm = getUSFM(ref[0]);
                let fileName = usfm['book']+'.'+usfm['initialChapter'];
                let passageContents = await window.electronAPI.readFile(fileName, "Scripture/NKJV");
                passageContents[0][0]['chapter'] = usfm['initialChapter'];

                if (!passageContents) {
                    setNoteContents(null);
                    return;
                }

                //trim to specific verses
                let initalVerse = 1, finalVerse = passageContents.length

                if (usfm['initialVerse']) {
                    initalVerse = usfm['initialVerse'];

                    if (usfm['finalVerse']) {
                        finalVerse = usfm['finalVerse'];
                    }
                    else {
                        finalVerse = initalVerse;
                    }
                }

                passageContents = passageContents.slice(initalVerse-1, finalVerse);
                passageContents[0][0]['verse'] = initalVerse;

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

export default Note;