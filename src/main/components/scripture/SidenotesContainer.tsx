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

    setAnnotatedVerses: Function;
    createNewNote: (id: string, selectedNoteGroup: string) => void;
    updateNotesContents?: (id: string, verse: string, selectedNoteGroup: string, noteContents: string, callback?: Function) => void; // TODO ? is only temporary
    deleteNote?: (id: string, selectedNoteGroup: string) => void; // TODO ? is only temporary
}

/**
 * A React component to ...
 *
 * @param {SidenotesContainer} props - The properties passed to the component.
 *
 * @returns {JSX.Element} A JSX Element of a `div` containing the sidenote.
 */
function SidenotesContainer({ position, passage, notesContents, selectedNoteGroup, docID, setAnnotatedVerses, createNewNote, updateNotesContents, deleteNote }: SidenotesContainerProps): JSX.Element {

    // const [selectedNoteGroup, setSelectedNoteGroup] = useState('');

    const [sidenotesElements, setSidenotesElements]: [any, Function] = useState([]);

    // useEffect(() => {
    //     updateSelectedNoteGroup(defaultGroup);
    // }, []);

    useEffect(() => {
        renderPassageNotes();
    }, [notesContents]);

    function renderPassageNotes(): void {

        const activeVerses = new Set<string>();

        const sidenotesElements = notesContents.map((noteContents: { id: string, verse: string, contents: string }) => {

            const passageName = `${passage}.${noteContents.verse}`;
            activeVerses.add(passageName)
            return (
                <Sidenote key={passageName} sidenote={passageName} base={passage}>
                    <NoteContent sidenoteID={noteContents.id} passageName={passageName} docID={docID} initialNoteContents={noteContents.contents} updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote} />
                </Sidenote>
            );
        });

        setSidenotesElements(sidenotesElements);
        setAnnotatedVerses(activeVerses);
    }

    function handleUpdateNotesContents(id: string, verse: string, noteContent: string, callback?: Function): void {
        if (updateNotesContents)
            updateNotesContents(id, verse, selectedNoteGroup, noteContent, callback);
    }

    function handleDeleteNote(id: string): void {
        if (deleteNote)
            deleteNote(id, selectedNoteGroup);
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