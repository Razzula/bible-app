import React, { useState, useEffect } from 'react';

import { Sidenote } from 'sidenotes';
import SidenoteContent from '../scripture/SidenoteContent';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';

type SidenotesContainer = {
    position: string;

    noteGroupsList: any;
    passage: string;
    notesContents: any;
    defaultGroup: string;
    docID?: string;

    setParentSelectedNoteGroup: Function;
    setAnnotatedVerses: Function;
    createNewNote: Function;
    updateNotesContents: Function;
    deleteNote: Function;
}

/**
 * A React component to ...
 *
 * @param {SidenotesContainer} props - The properties passed to the component.
 *
 * @returns {JSX.Element} A JSX Element of a `div` containing the sidenote.
 */
function SidenotesContainer({ position, noteGroupsList, passage, notesContents, defaultGroup, docID, setAnnotatedVerses, setParentSelectedNoteGroup, createNewNote, updateNotesContents, deleteNote }: SidenotesContainer) {

    const [selectedNoteGroup, setSelectedNoteGroup] = React.useState('');

    const [sidenotesElements, setSidenotesElements]: [any, Function] = React.useState([]);

    useEffect(() => {
        updateSelectedNoteGroup(defaultGroup);
    }, []);

    useEffect(() => {
        renderPassageNotes();
    }, [notesContents]);

    async function renderPassageNotes() {
        console.log(notesContents);

        const activeVerses = new Set<string>();

        const sidenotesElements = notesContents.map((noteContents: {id: string, verse: string, contents: string}) => {

            const passageName = `${passage}.${noteContents.verse}`;
            activeVerses.add(passageName)
            return (
                <Sidenote key={passageName} sidenote={passageName} base={passage}>
                    <SidenoteContent sidenoteID={noteContents.id} passageName={passageName} docID={docID} initialNoteContents={noteContents.contents} updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote}/>
                </Sidenote>
            );
        });

        setSidenotesElements(sidenotesElements);
        setAnnotatedVerses(activeVerses);
    }

    function handleUpdateNotesContents(id: string, verse: string, noteContent: string, callback?: Function) {
        updateNotesContents(id, verse, selectedNoteGroup, noteContent, callback);
    }

    function handleDeleteNote(id:string) {
        deleteNote(id, selectedNoteGroup);
    }

    function handleNewNoteClick() {

        var selectedText = window.getSelection()?.toString();
        if (selectedText !== '') {
            const id = crypto.randomUUID();
            createNewNote(id, selectedNoteGroup);
        }
    }

    function handleNotesSelectChange(event: React.ChangeEvent<any>) {
        updateSelectedNoteGroup(event.currentTarget.value);
    }

    function updateSelectedNoteGroup(notesGroupName: string) {
        setSelectedNoteGroup(notesGroupName);
        setParentSelectedNoteGroup(notesGroupName);
    }

    return (
        <div className={`sidenotes${position}`}>

            {/* NOTE GROUP SELECT */}
            <select className="select" onChange={handleNotesSelectChange}>
                {noteGroupsList}
            </select>
            {/* NEW NOTE BUTTON */}
            <button className='btn btn-default' onClick={handleNewNoteClick}>New note</button>

            {sidenotesElements}

        </div>
    );

}

export default SidenotesContainer;