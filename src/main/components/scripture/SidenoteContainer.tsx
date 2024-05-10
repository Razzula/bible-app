import React from 'react';
import { Sidenote } from 'sidenotes';

import NoteEditor from './NoteEditor';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';

type NoteContentProps = {
    sidenoteID: string;
    tokens: string[];
    docID?: string;
    initialNoteContents: string;
    currentBook: string;
    translation: string;
    loadPassage: any;
    updateNotesContents: (sidenoteID: string, tokens: string[], noteContents: string, callback: Function) => void;
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
function SidenoteContainer({ sidenoteID, tokens, docID, initialNoteContents, base, currentBook, translation, loadPassage, updateNotesContents, deleteNote }: NoteContentProps): JSX.Element {

    return (
        <div style={{ width: 280, height: 'auto' }}>
            <Sidenote key={sidenoteID} sidenote={sidenoteID} base={base}>
                <NoteEditor
                    sidenoteID={sidenoteID}
                    tokens={tokens}
                    docID={docID}
                    initialNoteContents={initialNoteContents}
                    currentBook={currentBook}
                    translation={translation}
                    loadPassage={loadPassage}
                    updateNotesContents={updateNotesContents}
                    deleteNote={deleteNote}
                />
            </Sidenote>
        </div>
    );

}

export default SidenoteContainer;