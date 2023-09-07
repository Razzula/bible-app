import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';

import { Store, Sidenote } from 'sidenotes';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';
import SidenoteContent from '../scripture/SidenoteContent';

import '../../styles/bible.scss';
import PassageChunk from './PassageChunk';

type Passage = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
    translation: string;
    docID?: string;
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
function Passage({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter, translation, docID }: Passage) {
    
    const [passageContents, setPassageContents]: [any, Function] = React.useState([]);
    const [passageElements, setPassageElements]: [any, Function] = React.useState([]);

    const [notesContents, setNotesContents]: [any, Function] = React.useState([]);
    const [sidenotesElements, setSidenotesElements]: [any, Function] = React.useState([]);

    const [annotatedVerses, setAnnotatedVerses]: [any, Function] = React.useState(new Set<string>());
    const [selectedVerse, setSelectedVerse]: [any, Function] = React.useState(null);

    useEffect(() => {
        if (contents !== null && contents !== undefined) {
            console.log('LOAD PASSAGE');
            generatePassage();
            console.log('LOAD NOTES');
            loadPassageNotes(`${passageBook}.${passageChapter}`);
        }
    }, [contents]);

    useEffect(() => {
        console.log('PROCESS PASSAGE');
        setPassageElements(
            <PassageChunk contents={passageContents} ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={passageBook} passageChapter={passageChapter} translation={translation} notedVerses={annotatedVerses} setSelectedVerse={setSelectedVerse}/>
        );
        console.log('annotatedVerses', annotatedVerses);
    }, [passageContents, annotatedVerses]);

    useEffect(() => {
        console.log('PROCESS NOTES');
        renderPassageNotes();
    }, [notesContents]);

    // presence check
    if (contents === null || contents === undefined) {
        return (
            <Alert variant="danger">
                <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
                <p>
                    Change this and that and try again.
                </p>
            </Alert>
        );
    }
    
    // LOAD AND GENERATE PASSAGE NOTES
    async function loadPassageNotes(fileName: string) {

        const rawNotesContents: [] = await window.electronAPI.readFile(fileName, "notes");

        if (rawNotesContents) {
            setNotesContents(rawNotesContents);
            console.log('loaded notes', rawNotesContents);
        }
    }

    async function renderPassageNotes() {

        const activeVerses = new Set<string>();
        const passage = `${passageBook}.${passageChapter}`;

        const sidenotesElements = notesContents.map((noteContents: {verse: string, contents: string}) => {

            const verse = `${passage}.${noteContents.verse}`;
            activeVerses.add(verse)
            return (
                <Sidenote key={verse} sidenote={verse} base={passage}>
                    <SidenoteContent sidenoteID={verse} docID={docID} initialNoteContents={noteContents.contents} updateNotesContents={updateNotesContents} deleteNote={deleteNote}/>
                </Sidenote>
            );
        });

        setSidenotesElements(sidenotesElements);
        console.log('activeVerses', activeVerses);
        setAnnotatedVerses(activeVerses);
    }

    async function updateNotesContents(id: string, noteContent: string, callback?: Function) {

        let newNotesContents: { verse: string; contents: string; }[] = [];
        console.log('updating note', id);

        setNotesContents((currentNotesContents: { verse: string; contents: string; }[]) => {
            // update notes contents
            currentNotesContents.forEach((note: {verse: string, contents: string}) => {
                if (String(note.verse) === id) {
                    note.contents = noteContent;
                }
                newNotesContents.push(note);
            });

            return newNotesContents;
        });

        // save to file
        const saveResult = await window.electronAPI.writeFile(`${passageBook}.${passageChapter}`, "notes", newNotesContents);
        if (callback) {
            callback(saveResult, noteContent);
        }
    }

    async function deleteNote(id:string) {

        setNotesContents((currentNotesContents: { verse: string; contents: string; }[]) => {
            let newNotesContents: { verse: string; contents: string; }[] = [];
            // update notes contents
            currentNotesContents.forEach((note: {verse: string, contents: string}) => {
                if (String(note.verse) !== id) {
                    newNotesContents.push(note);
                }
            });

            window.electronAPI.writeFile(`${passageBook}.${passageChapter}`, "notes", newNotesContents);
            return newNotesContents;
        });
    }

    async function createNewNote(id:string) {

        console.log('creating new note', id);
        
        setNotesContents((currentNotesContents: { verse: string; contents: string; }[]) => {
            let newNotesContents: { verse: string; contents: string; }[] = [];
            // update notes contents
            console.log('existing notes:', currentNotesContents.length)
            currentNotesContents.forEach((note: {verse: string, contents: string}) => {
                if (String(note.verse) !== id) {
                    console.log('\tpushing', id, note)
                    newNotesContents.push(note);
                }
            });
            console.log('\tpushing (NEW)', id)
            newNotesContents.push({
                verse: id,
                contents: "new note"
            });

            console.log(newNotesContents);
            debugger;

            window.electronAPI.writeFile(`${passageBook}.${passageChapter}`, "notes", newNotesContents);
            return newNotesContents;
        });

        // TODO; sometimes deletes all notes after manual load
        // TODO; add callback to select new note
    }

    function handleNewNoteClick() {
        console.log('button clicked');

        var selectedText = window.getSelection()?.toString();
        if (selectedText !== '') {
            const id = selectedVerse.split('.');
            createNewNote(id[id.length - 1]);
        }
    }

    // DYNAMICALLY GENERATE PASSAGE
    function generatePassage() {
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
                    paragraphs.push([{"type":"s", "content":section.header}]);
                }
                
                // verse numbers
                if (ii === 0) {
                    if (section.verse) {
                        verse = section.verse;
                    }
                    if (section.chapter) {
                        // use chapter number instead of verse
                        temp.push({"type":"label chapter", "content":section.chapter});
                    }
                    else {
                        temp.push({"type":"label", "content":verse+i});
                    }   
                }
                
                section.test = `${passageBook}.${passageChapter}.${verse+i}`; // TODO; rename 'verse'->'initialVerse', 'test'->'verse'
                temp.push(section);
            };
        }
        paragraphs.push(temp);

        setPassageContents(paragraphs);
    }
    
    return (<>
        {passageElements}
    
        <div className="sidenotes">

        <button className='btn btn-default' onClick={handleNewNoteClick}>New note</button>

            {sidenotesElements}

            {/* <Sidenote sidenote='testR' base={baseAnchor}>
                <div style={{ width: 280, height: 100}}>right-hand note</div>
            </Sidenote> */}
        </div>

        <div className="sidenotes l">
            {/* <Sidenote sidenote='testL' base={baseAnchor}>
                <div style={{ width: 280, height: 100}}>left-hand note</div>
            </Sidenote> */}
        </div>
    </>);
}

export default Passage;