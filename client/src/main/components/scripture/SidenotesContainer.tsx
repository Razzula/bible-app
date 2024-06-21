import React, { useState, useEffect } from 'react';

import SidenoteContainer from './SidenoteContainer';
import { LOADIPHLPAPI } from 'dns';

type SidenotesContainerProps = {
    position: string;

    passage: string;
    notesContents: any[];
    docID?: string;

    currentBook: string;
    translation: string;

    loadPassage: any;
    updateNotesContents: (sidenoteID: string, tokens: string[], noteContents: string, callback: Function) => void;
    deleteNote: (sidenoteID: string) => void;
}

/**
 * A React component to ...
 *
 * @param {SidenotesContainer} props - The properties passed to the component.
 *
 * @returns {JSX.Element} A JSX Element of a `div` containing the sidenote.
 */
function SidenotesContainer({ position, passage, notesContents, docID, currentBook, translation, loadPassage, updateNotesContents, deleteNote }: SidenotesContainerProps): JSX.Element {

    const [sidenotesElements, setSidenotesElements]: [any, Function] = useState([]);

    useEffect(() => {
        renderPassageNotes();
    }, [notesContents]);

    function renderPassageNotes(): void {

        const sidenotesElements = notesContents.map((noteContents: { id: string, tokens: string[], contents: string }) => {

            return (
                <SidenoteContainer key={noteContents.id} // TODO: switch these ???
                    sidenoteID={noteContents.id} tokens={noteContents.tokens} docID={docID} initialNoteContents={noteContents.contents} base={passage}
                    currentBook={currentBook} translation={translation}
                    loadPassage={loadPassage} updateNotesContents={updateNotesContents} deleteNote={deleteNote}
                />
            );
        });

        setSidenotesElements(sidenotesElements);
    }

    return (
        <div className={`sidenotes${position}`}>
            {sidenotesElements}
        </div>
    );

}

export default SidenotesContainer;