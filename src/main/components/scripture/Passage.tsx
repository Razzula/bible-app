import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';
import SidenotesContainer from './SidenotesContainer';
import NoteContent from './NoteContent';
import { isOfParagraphType } from '../../utils/general';

import '../../styles/bible.scss';
import PassageChunk from './PassageChunk';

type PassageProps = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
    translation: string;
    docID?: string;
    selectedNoteGroup?: string;
    renderMode?: string;
}

type Note = {
    id: string;
    verse: string;
    contents: any;
}

/**
 * A React component to display scripture.
 * 
 * @param {PassageProps} props - The properties passed to the component.
 *   - contents (any): The contents of the scripture.
 *   - ignoreFootnotes (boolean): Whether to ignore footnotes.
 *   - loadPassage (Function): A function to load a passage.
 *   - passageBook (string): The current book.
 *   - passageChapter (number): The current chapter.
 * 
 * @returns {JSX.Element} A JSX Element of a `span` containing the scripture.
*/
function Passage({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, selectedNoteGroup, docID, renderMode }: PassageProps): JSX.Element {

    const [passageContents, setPassageContents]: [any, (a: any) => void] = useState([]);
    const [passageElements, setPassageElements]: [any, (a: any) => void] = useState([]);

    const [notesContents, setNotesContents]: [any, (a: any) => void] = useState([]);

    const [annotatedVerses, setAnnotatedVerses]: [Set<string>, (a: any) => void] = useState(new Set<string>());
    const [selectedVerse, setSelectedVerse]: [any, (a: any) => void] = useState(null);

    const shouldLoad = (contents !== null && contents !== undefined);
    const shouldLoadNotes = (shouldLoad && selectedNoteGroup !== undefined);

    useEffect(() => {
        if (shouldLoad) {
            generatePassage();
            
            if (shouldLoadNotes) {
                void loadPassageNotes(selectedNoteGroup, `${passageBook}`, `${passageChapter}`);
            }
        }

    }, [contents]);

    useEffect(() => {
        if (shouldLoadNotes) {
            void loadPassageNotes(selectedNoteGroup, `${passageBook}`, `${passageChapter}`);
        }
    }, [selectedNoteGroup]);

    useEffect(() => {
        if (passageContents) {
            renderPassage();
        }
    }, [passageContents, annotatedVerses, renderMode]);

    // presence check
    if (contents === null || contents === undefined) {
        return (
            <Alert variant="danger">
                <Alert.Heading>404</Alert.Heading>
                <p>
                    Error: {passageBook} {passageChapter} not found.
                </p>
            </Alert>
        );
    }

    // LOAD PASSAGE NOTES
    async function loadPassageNotes(group: string, book: string, chapter: string): Promise<void> {

        if (group == null || group.trim() === '') {
            return;
        }

        const rawNotesContents: [] = await window.electronAPI.loadNotes(group, book, chapter);

        if (rawNotesContents) {
            setNotesContents(rawNotesContents);
        }
    }

    // HANDLE NOTES
    async function updateNotesContents(id: string, verse: string, selectedNoteGroup: string, noteContent: string, callback?: Function): Promise<void> {

        const newNoteContents = {
            verse,
            contents: noteContent
        };

        setNotesContents((currentNotesContents: Note[]) => {

            const newNotesContents: Note[] = [];
            // update notes contents
            currentNotesContents.forEach((note: Note) => {
                if (note.id === id) {
                    note.contents = noteContent;
                }
                newNotesContents.push(note);
            });

            return newNotesContents;
        });

        // save to file
        const saveResult = await window.electronAPI.saveNote(`${id}`, selectedNoteGroup, passageBook, String(passageChapter), newNoteContents);
        if (callback) {
            callback(saveResult, noteContent);
        }
    }

    function deleteNote(id: string, selectedNoteGroup: string): void {

        setNotesContents((currentNotesContents: Note[]) => {
            const newNotesContents: Note[] = [];
            // update notes contents
            currentNotesContents.forEach((note: Note) => {
                if (note.id !== id) {
                    newNotesContents.push(note);
                }
            });

            return newNotesContents;
        });
        
        // electron function to delete note
        window.electronAPI.deleteNote(`${id}`, selectedNoteGroup, passageBook, String(passageChapter));
    }

    function createNewNote(id: string, selectedNoteGroup: string): void {

        const temp = selectedVerse.split('.');
        const verse = temp[temp.length - 1];

        const newNoteContents: Note = {
            id,
            verse,
            contents: { "root": { "children": [{ "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "new note", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "paragraph", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "root", "version": 1 } } //TODO this should probably be extracted somewhere
        };

        setNotesContents((currentNotesContents: Note[]) => {
            const newNotesContents: Note[] = [];
            // update notes contents
            currentNotesContents.forEach((note: Note) => {
                if (note.id !== id) {
                    newNotesContents.push(note);
                }
            });

            newNotesContents.push(newNoteContents);

            return newNotesContents;
        });

        window.electronAPI.saveNote(`${id}`, selectedNoteGroup, passageBook, String(passageChapter), newNoteContents);
    }

    // DYNAMICALLY GENERATE PASSAGE
    function generatePassage(): void {

        // split content into paragraphs
        // const paragraphs = [];
        let formattedContent = [];

        let verse = 1;
        for (let i = 0; i < contents.length; i++) { // iterate through verses

            if (!Array.isArray(contents[i])) { // TODO; convert below code to function and use that instead
                contents[i] = [contents[i]];
            }

            // content
            for (let ii = 0; ii < contents[i].length; ii++) { // iterate through verse sub-sections

                const section = contents[i][ii];

                // header
                if (section.header) {
                    formattedContent.push({ "type": "s", "content": section.header });
                    delete section.header;
                }

                // verse numbers
                if (ii === 0) {

                    if (section.verse) {
                        verse = section.verse;
                    }
                    const label = (section.chapter) ? { "type": "label chapter", "content": section.chapter } : { "type": "label", "content": verse + i };

                    // paragraph
                    const paraType = isOfParagraphType(section.type);
                    if (section.type) {
                        if (paraType) { // new paragraph
                            label.type += ` ${paraType}`;
                            section.type = section.type.replace(new RegExp(`\\s*${paraType}\\s*`, 'g'), '')
                        }
                    }

                    formattedContent.push(label);
                }

                section.id = `${passageBook}.${passageChapter}.${verse + i}`; // TODO; rename 'verse'->'initialVerse' //TODO support multiple chapters
                // section.token = undefined; // TODO
                formattedContent.push(section);
            };
        }
        // paragraphs.push(temp);

        console.log(formattedContent);
        setPassageContents(formattedContent);
    }

    function renderPassage(): void {

        if (renderMode === 'sidenotes') {
            setPassageElements(
                <PassageChunk contents={passageContents} ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={passageBook} passageChapter={passageChapter} translation={translation} notedVerses={annotatedVerses} setSelectedVerse={setSelectedVerse} renderMode={renderMode} />
            );
        }

        else if (renderMode === 'interlinear') {
            let tempPassageElements: JSX.Element[] = [];

            // TODO; handle 0 notes

            // get split points
            let annotations: any = {};
            for (const annotation of annotatedVerses) {
                annotations[annotation] = {};
            }
            for (let i = 0; i < passageContents.length; i++) {

                if (passageContents[i].id) {
                    for (const annotation of annotatedVerses) {
                        
                        if (passageContents[i].id === annotation) {
                            if (annotations[annotation]['start'] === undefined) {
                                annotations[annotation]['start'] = (passageContents[i-1].type.includes('label')) ? i-1 : i;
                            }
                            annotations[annotation]['end'] = i;
                        }

                    }
                }
            }
            let splitPoints: any = Object.entries(annotations);

            // render
            let temp: JSX.Element[] = [];
            let splitPoint = splitPoints.shift();
            for (let i = 0; i < passageContents.length; i++) {

                if (splitPoint) {
                    if (i === splitPoint[1].start) {
                        // start of note

                        // unannotated chunk
                        tempPassageElements.push(
                            <PassageChunk
                                contents={temp}
                                ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={passageBook} passageChapter={passageChapter} translation={translation} notedVerses={annotatedVerses} setSelectedVerse={setSelectedVerse} renderMode={renderMode}
                            />
                        );

                        temp = [];
                    }

                    // add to chunk
                    temp.push(passageContents[i]);

                    if (i === splitPoint[1].end) {
                        // end of note

                        // annotated chunk
                        if (temp[0].type) {
                            if (!isOfParagraphType(temp[0].type)) {
                                temp[0].type += ' p';
                            }
                        }
                        else {
                            temp[0].type = 'p';
                        }

                        tempPassageElements.push(
                            <PassageChunk
                                contents={temp}
                                ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={passageBook} passageChapter={passageChapter} translation={translation} notedVerses={annotatedVerses} setSelectedVerse={setSelectedVerse} renderMode={renderMode}
                            />
                        );

                        // note
                        tempPassageElements.push(<div>NOTE</div>);

                        // continue
                        splitPoint = splitPoints.shift();
                        temp = [];
                    }
                }
                else {
                    // add to chunk
                    temp.push(passageContents[i]);
                }
            }
            tempPassageElements.push(
                <PassageChunk
                    contents={temp}
                    ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={passageBook} passageChapter={passageChapter} translation={translation} notedVerses={annotatedVerses} setSelectedVerse={setSelectedVerse} renderMode={renderMode}
                />
            );
            
            setPassageElements(tempPassageElements);
        }

    }

    return (
        <div className='passage'>
            {passageElements}

            {(!ignoreFootnotes && shouldLoadNotes && renderMode === 'sidenotes')
                ? <>
                    <SidenotesContainer position='' passage={`${passageBook}.${passageChapter}`} notesContents={notesContents} selectedNoteGroup={selectedNoteGroup} docID={docID} setAnnotatedVerses={setAnnotatedVerses} createNewNote={createNewNote} updateNotesContents={updateNotesContents} deleteNote={deleteNote} />
                    {/* <SidenotesContainer position=' l' passage={`${passageBook}.${passageChapter}`} notesContents={notesContents} defaultGroup='GROUP' docID={docID} setAnnotatedVerses={setAnnotatedVerses} setParentSelectedNoteGroup={setSelectedNoteGroup} createNewNote={createNewNote} updateNotesContents={updateNotesContents} deleteNote={deleteNote} /> */}
                </>
                : null
            }

        </div>
    );
}

export default Passage;