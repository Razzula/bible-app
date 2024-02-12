import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { State } from 'sidenotes/dist/src/store';
import { isSidenoteSelected } from 'sidenotes/dist/src/store/ui/selectors';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import '../../styles/editor.scss';
import { EditorState } from 'lexical';

type NoteContentProps = {
    sidenoteID: string;
    passageName: string;
    docID?: string;
    initialNoteContents: string;
    updateNotesContents: (sidenoteID: string, passageName: string, noteContents: string, callback: Function) => void;
    deleteNote: (sidenoteID: string) => void;
}

// const theme = {
//     // Theme styling goes here
// }

/**
 * A React component to display and edit the contents of a sidenote.
 *
 * @param {SidenoteContentProps} props - The properties passed to the component.
 *   - id (string): The unique identifier of the sidenote.
 *   - initialNoteContents (string): The initial contents of the sidenote.
 *
 * @returns {JSX.Element} A JSX Element of a `div` containing the sidenote.
 */
function NoteContent({ sidenoteID, passageName, docID, initialNoteContents, updateNotesContents, deleteNote }: NoteContentProps): JSX.Element {

    const [currentNoteContents, setCurrentNoteContents] = useState(initialNoteContents);
    const [committedNoteContents, setCommittedNoteContents] = useState(initialNoteContents);

    const isSelected = useSelector((state: State) => isSidenoteSelected(state, docID, passageName));
    const isSaved = (currentNoteContents === committedNoteContents);
    const backgroundColour = (isSaved ? '#00FF00' : '#FF0000');

    useEffect(() => {
        //const temp = JSON.parse(initialNoteContents);
        setCurrentNoteContents(initialNoteContents);
        setCommittedNoteContents(initialNoteContents);
    }, [sidenoteID, initialNoteContents]);

    useEffect(() => {
        if (!isSelected && !isSaved) {
            const passageNameSplit = passageName.split('.');
            updateNotesContents(sidenoteID, passageNameSplit[passageNameSplit.length - 1], currentNoteContents, saveNoteContentsCallback);
        }
    }, [isSelected]);

    function handleChange(editorState: any): void {
        const temp = editorState.toJSON();
        setCurrentNoteContents(temp);
        // const editorStateJSON = editorState.toJSON()
        // setCurrentNoteContents(JSON.stringify(editorStateJSON));
    }

    function handleDeleteClick(): void {
        deleteNote(sidenoteID);
    }

    function saveNoteContentsCallback(saveResult: boolean, noteContents: string): void {
        if (saveResult) {
            setCommittedNoteContents(noteContents);
        }
        else {
            console.log("ERROR: Failed to save note contents.");
        }
    }

    function onError(error: Error): void {
        console.error(error);
    }

    return (
        <div style={{ width: 280, height: 'auto', backgroundColor: backgroundColour }}>
            <div>
                <span>{isSaved ? 'SAVED' : 'UNSAVED'}</span>
                <button className='btn btn-default' onClick={handleDeleteClick}>Delete</button>
                {/* <textarea value={currentNoteContents} onChange={handleChange} /> */}
            </div>

            <div style={{ height: 'auto' }}>
                <LexicalComposer initialConfig={{
                    namespace: 'name',
                    onError,
                    editorState: JSON.stringify(initialNoteContents)
                }}>
                    <div className="editor-container">
                        <RichTextPlugin
                            contentEditable={<ContentEditable className="editor-input" />}
                            placeholder={<div className="editor-placeholder">Enter some plain text...</div>}
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                    </div>
                    <OnChangePlugin onChange={handleChange} />
                    <HistoryPlugin />
                </LexicalComposer>
            </div>
        </div>
    );

}

export default NoteContent;