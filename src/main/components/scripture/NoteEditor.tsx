import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import { State, Store } from 'sidenotes/dist/src/store';
import { deselectSidenote, repositionSidenotes, resetAllSidenotes, selectSidenote, updateSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { isSidenoteSelected } from 'sidenotes/dist/src/store/ui/selectors';
import { Editor } from '@tinymce/tinymce-react';

import '../../styles/editor.scss';

type NoteEditorProps = {
    sidenoteID: string;
    tokens: string[];
    docID?: string;
    initialNoteContents: string;
    currentBook: string;
    translation: string;
    loadPassage: any;
    updateNotesContents: (sidenoteID: string, tokens: string[], noteContents: string, callback: Function) => void;
    deleteNote: (sidenoteID: string) => void;
}

function NoteEditor({ sidenoteID, tokens, docID, initialNoteContents, currentBook, translation, loadPassage, updateNotesContents, deleteNote }: NoteEditorProps): JSX.Element {

    const ref = useRef(null);

    const [currentNoteContents, setCurrentNoteContents] = useState(initialNoteContents);
    const [committedNoteContents, setCommittedNoteContents] = useState(initialNoteContents);
    const [isReadOnly, setIsReadOnly] = useState(true);

    const isSelected = useSelector((state: State) => isSidenoteSelected(state, docID, sidenoteID));
    const isSaved = (currentNoteContents === committedNoteContents);
    const backgroundColour = (isSaved ? '#00FF00' : '#FF0000');

    const store: Store = useStore();

    useEffect(() => {
        setCurrentNoteContents(initialNoteContents);
        setCommittedNoteContents(initialNoteContents);
    }, [sidenoteID, initialNoteContents]);

    useEffect(() => {
        if (!isSelected) {
            setIsReadOnly(true);
            if (!isSaved) {
                updateNotesContents(sidenoteID, tokens, currentNoteContents, saveNoteContentsCallback);
            }
        }
    }, [isSelected]);

    function handleSelection(event: React.MouseEvent): void {
        event.stopPropagation();
        store.dispatch(selectSidenote(docID, sidenoteID));
    }

    function handleEditorChange(content: string, editor: any): void {
        setCurrentNoteContents(content);
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

    function handleEditClick(event: React.MouseEvent): void {
        event.stopPropagation();
        setIsReadOnly(false);
        store.dispatch(selectSidenote(docID, sidenoteID));
    }

    return (
        <div
            style={{ height: 'auto', backgroundColor: backgroundColour }}
            onClick={handleSelection}
        >
            <div>
                {isReadOnly ? <button className='btn btn-default' onClick={handleEditClick}>Edit</button> : null}
                <span>{isSaved ? 'SAVED' : 'UNSAVED'}</span>
                <button className='btn btn-default' onClick={handleDeleteClick}>Delete</button>
            </div>

            <div ref={ref} style={{ height: 'auto' }}>
                {/* @ts-ignore */}
                <Editor
                    initialValue={initialNoteContents}
                    disabled={isReadOnly}
                    init={{
                        licenseKey: 'gpl',
                        // tinymceScriptSrc: 'http://localhost:3180/tinymce/tinymce.min.js', // this did not work, and so is added to index.html

                        plugins: [
                            'autoresize',
                        ],

                        setup: (editor) => {
                            editor.on('init', () => {

                                if (docID) {
                                    store.dispatch(repositionSidenotes(docID));
                                }

                                editor.on('ExecCommand', (e) => {
                                    console.log(`The ${e.command} command was fired.`);
                                });

                                editor.on('NodeChange', () => {
                                    if (docID) {
                                        // TODO: make this more efficient (only update when necessary)
                                        store.dispatch(repositionSidenotes(docID));
                                    }
                                });
                            });
                        },

                        menubar: false,
                        toolbar: false,
                        statusbar: false,
                        branding: false,
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }',
                    }}
                    onEditorChange={handleEditorChange}
                />
            </div>
        </div>
    );
}

export default NoteEditor;
