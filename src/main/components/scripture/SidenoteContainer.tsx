import React from 'react';

import { Sidenote } from 'sidenotes';
import NoteContent from './NoteContent';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';

type NoteContentProps = {
    sidenoteID: string;
    passageName: string;
    docID?: string;
    initialNoteContents: string;
    updateNotesContents: (sidenoteID: string, passageName: string, noteContents: string, callback: Function) => void;
    deleteNote: (sidenoteID: string) => void;

    base: string;
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
function SidenoteContainer({ sidenoteID, passageName, docID, initialNoteContents, base, updateNotesContents, deleteNote }: NoteContentProps): JSX.Element {

    return (
        <div style={{ width: 280, height: 'auto' }}>
            <Sidenote key={passageName} sidenote={passageName} base={base}>
                <NoteContent
                    sidenoteID={sidenoteID}
                    passageName={passageName}
                    docID={docID}
                    initialNoteContents={initialNoteContents}
                    updateNotesContents={updateNotesContents}
                    deleteNote={deleteNote}
                />
            </Sidenote>
        </div>
    );

}

export default SidenoteContainer;