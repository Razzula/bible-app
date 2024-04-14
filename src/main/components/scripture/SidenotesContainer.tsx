import React, { useState, useEffect } from 'react';

import { Sidenote } from 'sidenotes';
import NoteContent from './NoteContent';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';

type SidenotesContainerProps = {
    position: string;

    passage: string;
    notesContents: any[];
    selectedNoteGroup: string;
    docID?: string;

    createNewNote: (id: string, selectedNoteGroup: string) => void;
    updateNotesContents: (sidenoteID: string, passageName: string, noteContents: string, callback: Function) => void;
    deleteNote: (sidenoteID: string) => void;
}

/**
 * A React component to ...
 *
 * @param {SidenotesContainer} props - The properties passed to the component.
 *
 * @returns {JSX.Element} A JSX Element of a `div` containing the sidenote.
 */
function SidenotesContainer({ position, passage, notesContents, selectedNoteGroup, docID, createNewNote, updateNotesContents, deleteNote }: SidenotesContainerProps): JSX.Element {

    // const [selectedNoteGroup, setSelectedNoteGroup] = useState('');

    const [sidenotesElements, setSidenotesElements]: [any, Function] = useState([]);

    // useEffect(() => {
    //     updateSelectedNoteGroup(defaultGroup);
    // }, []);

    useEffect(() => {
        renderPassageNotes();
    }, [notesContents]);

    function renderPassageNotes(): void {

        const sidenotesElements = notesContents.map((noteContents: { id: string, verse: string, contents: string }) => {

            return (
                <Sidenote key={noteContents.verse} sidenote={noteContents.verse} base={passage}>
                    <NoteContent
                        sidenoteID={noteContents.id} passageName={noteContents.verse} docID={docID} initialNoteContents={noteContents.contents}
                        updateNotesContents={updateNotesContents} deleteNote={deleteNote}
                    />
                </Sidenote>
            );
        });

        setSidenotesElements(sidenotesElements);
    }

    function handleNewNoteClick(): void {

        const selectedText = window.getSelection()?.toString();
        if (selectedText !== '') {
            const id = crypto.randomUUID();
            createNewNote(id, selectedNoteGroup);
        }
    }

    return (
        <div className={`sidenotes${position}`}>

            {/* NEW NOTE BUTTON */}
            <button className='btn btn-default' onClick={handleNewNoteClick}>New note</button>

            {sidenotesElements}

        </div>
    );

}

export default SidenotesContainer;