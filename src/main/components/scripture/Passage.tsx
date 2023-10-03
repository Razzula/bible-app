import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';
import SidenotesContainer from './SidenotesContainer';

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
function Passage({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, selectedNoteGroup, docID }: PassageProps): JSX.Element {

    const [passageContents, setPassageContents]: [any, Function] = useState([]);
    const [passageElements, setPassageElements]: [any, Function] = useState([]);

    const [notesContents, setNotesContents]: [any, Function] = useState([]);

    const [annotatedVerses, setAnnotatedVerses]: [any, Function] = useState(new Set<string>());
    const [selectedVerse, setSelectedVerse]: [any, Function] = useState(null);

    const shouldLoadNotes = (contents !== null && contents !== undefined && selectedNoteGroup !== undefined);

    useEffect(() => {
        if (shouldLoadNotes) {
            generatePassage();
            void loadPassageNotes(selectedNoteGroup, `${passageBook}`, `${passageChapter}`);
        }
    }, [contents]);

    useEffect(() => { //DEBUG
        if (shouldLoadNotes) {
            void loadPassageNotes(selectedNoteGroup, `${passageBook}`, `${passageChapter}`);
        }
    }, [selectedNoteGroup]);

    useEffect(() => {
        setPassageElements(
            <PassageChunk contents={passageContents} ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={passageBook} passageChapter={passageChapter} translation={translation} notedVerses={annotatedVerses} setSelectedVerse={setSelectedVerse} />
        );
    }, [passageContents, annotatedVerses]);

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

    // LOAD AND GENERATE PASSAGE NOTES
    async function loadPassageNotes(group: string, book: string, chapter: string): Promise<void> {

        if (group == null || group.trim() === '') {
            return;
        }

        const rawNotesContents: [] = await window.electronAPI.loadNotes(group, book, chapter);

        if (rawNotesContents) {
            setNotesContents(rawNotesContents);
        }
    }

    async function updateNotesContents(id: string, verse: string, selectedNoteGroup: string, noteContent: string, callback?: Function): Promise<void> {

        const newNoteContents = {
            verse,
            contents: noteContent
        };

        setNotesContents((currentNotesContents: { id: string; verse: string; contents: string; }[]) => { // TODO; this type is being reused a lot

            const newNotesContents: { id: string; verse: string; contents: string; }[] = [];
            // update notes contents
            currentNotesContents.forEach((note: { id: string; verse: string, contents: string }) => {
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

        setNotesContents((currentNotesContents: { verse: string; contents: string; }[]) => {
            const newNotesContents: { verse: string; contents: string; }[] = [];
            // update notes contents
            currentNotesContents.forEach((note: { verse: string, contents: string }) => {
                if (String(note.verse) !== id) {
                    newNotesContents.push(note);
                }
            });

            // TODO; electron function to delete note
            return newNotesContents;
        });

        window.electronAPI.deleteNote(`${id}`, selectedNoteGroup, passageBook, String(passageChapter));
    }

    function createNewNote(id: string, selectedNoteGroup: string): void {

        const temp = selectedVerse.split('.');
        const verse = temp[temp.length - 1];

        const newNoteContents = {
            verse,
            contents: { "root": { "children": [{ "children": [{ "detail": 0, "format": 0, "mode": "normal", "style": "", "text": "new note", "type": "text", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "paragraph", "version": 1 }], "direction": "ltr", "format": "", "indent": 0, "type": "root", "version": 1 } }
        };

        setNotesContents((currentNotesContents: { verse: string; contents: string; }[]) => {
            const newNotesContents: { verse: string; contents: any; }[] = [];
            // update notes contents
            currentNotesContents.forEach((note: { verse: string, contents: string }) => {
                if (String(note.verse) !== verse) {
                    newNotesContents.push(note);
                }
            });

            newNotesContents.push(newNoteContents);

            return newNotesContents;
        });

        window.electronAPI.saveNote(`${id}`, selectedNoteGroup, passageBook, String(passageChapter), newNoteContents);

        // TODO; sometimes deletes all notes after manual load
        // TODO; add callback to select new note
    }

    // DYNAMICALLY GENERATE PASSAGE
    function generatePassage(): void {
        // split content into paragraphs
        const paragraphs = [];
        let temp = [];

        let verse = 1;
        for (let i = 0; i < contents.length; i++) { // iterate through verses

            if (!Array.isArray(contents[i])) { // TODO; convert below code to function and use that instead
                contents[i] = [contents[i]];
            }

            // content
            for (let ii = 0; ii < contents[i].length; ii++) { // iterate through verse sections

                const section = contents[i][ii];

                if (section.type === 'p' || section.type === 'q1' || section.type === 'q2' || section.type === 'pc' || section.type === 'qs') { // new paragraph
                    if (temp.length !== 0) { // store previous sections as a paragraph
                        paragraphs.push(temp);
                    }
                    temp = []; // begin new paragraph
                }
                // header
                if (section.header != null) {
                    paragraphs.push([{ "type": "s", "content": section.header }]);
                }

                // verse numbers
                if (ii === 0) {
                    if (section.verse) {
                        verse = section.verse;
                    }
                    if (section.chapter) {
                        // use chapter number instead of verse
                        temp.push({ "type": "label chapter", "content": section.chapter });
                    }
                    else {
                        temp.push({ "type": "label", "content": verse + i });
                    }
                }

                section.test = `${passageBook}.${passageChapter}.${verse + i}`; // TODO; rename 'verse'->'initialVerse', 'test'->'verse'
                temp.push(section);
            };
        }
        paragraphs.push(temp);

        setPassageContents(paragraphs);
    }

    return (<>
        {passageElements}

        {(!ignoreFootnotes && shouldLoadNotes)
            ? <>
                <SidenotesContainer position='' passage={`${passageBook}.${passageChapter}`} notesContents={notesContents} selectedNoteGroup={selectedNoteGroup} docID={docID} setAnnotatedVerses={setAnnotatedVerses} createNewNote={createNewNote} updateNotesContents={updateNotesContents} deleteNote={deleteNote} />
                {/* <SidenotesContainer position=' l' passage={`${passageBook}.${passageChapter}`} notesContents={notesContents} defaultGroup='GROUP' docID={docID} setAnnotatedVerses={setAnnotatedVerses} setParentSelectedNoteGroup={setSelectedNoteGroup} createNewNote={createNewNote} updateNotesContents={updateNotesContents} deleteNote={deleteNote} /> */}
            </>
            : null
        }


    </>);
}

export default Passage;