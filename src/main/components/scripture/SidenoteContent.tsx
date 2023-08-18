import React, { useState, useEffect } from 'react';

type SidenoteContent = {
    id: string;
    initialNoteContents: string;
    updateNotesContents: Function;
}

/**
 * A React component to display and edit the contents of a sidenote.
 *
 * @param {SidenoteContentProps} props - The properties passed to the component.
 *   - id (string): The unique identifier of the sidenote.
 *   - initialNoteContents (string): The initial contents of the sidenote.
 *
 * @returns {JSX.Element} A JSX Element of a `div` containing the sidenote.
 */
function SidenoteContent({id, initialNoteContents, updateNotesContents}: SidenoteContent) {
    const [currentNoteContents, setCurrentNoteContents] = useState(initialNoteContents);
    const [committedNoteContents, setCommittedNoteContents] = useState(initialNoteContents);

    useEffect(() => {
        setCurrentNoteContents(initialNoteContents);
    }, [id, initialNoteContents]);

    function handleChange(event: React.ChangeEvent<any>) {
        setCurrentNoteContents(event.currentTarget.value);

        const splitId = id.split(".");
        updateNotesContents(splitId[splitId.length - 1], event.currentTarget.value, saveNoteContentsCallback); //TODO; only call on deselection
    }

    function saveNoteContentsCallback(saveResult: boolean, noteContents: string) {
        if (saveResult) {
            setCommittedNoteContents(noteContents);
        }
        else {
            console.log("ERROR: Failed to save note contents.");
        }
    }

    console.log(committedNoteContents)
    return (
        <div style={{ width: 280, height: 150}}>
            <span>SAVED = {String(currentNoteContents === committedNoteContents)}</span>
            <textarea value={currentNoteContents} onChange={handleChange} />
        </div>
    );

}

export default SidenoteContent;