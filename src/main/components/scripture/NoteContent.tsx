import { AutoLinkNode } from '@lexical/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import { State, Store } from 'sidenotes/dist/src/store';
import { selectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { isSidenoteSelected } from 'sidenotes/dist/src/store/ui/selectors';

import AutoBibleReferencePlugin from '../lexical/plugins/AutoBibleReferencePlugin';
import { FloatingToolbarPlugin } from '../lexical/plugins/FloatingToolbarPlugin';

import '../../styles/editor.scss';

type NoteContentProps = {
    sidenoteID: string;
    tokens: string[];
    docID?: string;
    initialNoteContents: string;
    updateNotesContents: (sidenoteID: string, tokens: string[], noteContents: string, callback: Function) => void;
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
function NoteContent({ sidenoteID, tokens, docID, initialNoteContents, updateNotesContents, deleteNote }: NoteContentProps): JSX.Element {

    const ref = useRef(null);

    const [currentNoteContents, setCurrentNoteContents] = useState(initialNoteContents);
    const [committedNoteContents, setCommittedNoteContents] = useState(initialNoteContents);

    const isSelected = useSelector((state: State) => isSidenoteSelected(state, docID, sidenoteID));
    const isSaved = (currentNoteContents === committedNoteContents);
    const backgroundColour = (isSaved ? '#00FF00' : '#FF0000');

    const store: Store = useStore();

    useEffect(() => {
        //const temp = JSON.parse(initialNoteContents);
        setCurrentNoteContents(initialNoteContents);
        setCommittedNoteContents(initialNoteContents);
    }, [sidenoteID, initialNoteContents]);

    useEffect(() => {
        if (!isSelected && !isSaved) {
            updateNotesContents(sidenoteID, tokens, currentNoteContents, saveNoteContentsCallback);
        }
    }, [isSelected]);

    function handleSelection(event: React.MouseEvent): void {
        event.stopPropagation();
        store.dispatch(selectSidenote(docID, sidenoteID));
    }

    function handleChange(editorState: any): void {
        const temp = editorState.toJSON();
        setCurrentNoteContents(temp);
        // const editorStateJSON = editorState.toJSON()
        // setCurrentNoteContents(JSON.stringify(editorStateJSON));
    }

    function handleDeleteClick(event: React.MouseEvent): void {
        event.stopPropagation();
        deleteNote(sidenoteID);
    }

    function saveNoteContentsCallback(saveResult: boolean, noteContents: string): void {
        if (saveResult) {
            setCommittedNoteContents(noteContents);
        }
        else {
            console.error("ERROR: Failed to save note contents.");
        }
    }

    function onError(error: Error): void {
        console.error(error);
    }

    return (
        <div
            style={{ height: 'auto', backgroundColor: backgroundColour }}
            onClick={handleSelection}
        >
            <div>
                <span>{isSaved ? 'SAVED' : 'UNSAVED'}</span>
                <button className='btn btn-default' onClick={handleDeleteClick}>Delete</button>
                {/* <textarea value={currentNoteContents} onChange={handleChange} /> */}
            </div>

            <div ref={ref} style={{ height: 'auto' }}>
                <LexicalComposer initialConfig={{
                    namespace: 'name',
                    onError,
                    editorState: JSON.stringify(initialNoteContents),
                    nodes: [AutoLinkNode]
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

                    <FloatingToolbarPlugin editorRef={ref} />
                    <AutoBibleReferencePlugin />
                </LexicalComposer>
            </div>
        </div>
    );

}

export default NoteContent;
