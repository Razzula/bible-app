import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/sidenotes.scss';
import SidenotesContainer from './SidenotesContainer';
import NoteContent from './NoteContent';
import PassageChunk from './PassageChunk';
import { isOfParagraphType } from '../../utils/general';
import { Store, AnchorBase } from 'sidenotes';

import '../../styles/Bible.scss';

const baseAnchor = 'anchor';

type PassageProps = {
    contents: any;
    usfm?: any;
    ignoreFootnotes?: boolean;
    renderMode?: string;
    loadPassage?: any;
    // passageBook?: string;
    // passageChapter?: number;
    translation: string;
    docID?: string;
    selectedNoteGroup?: string;
}

type Note = {
    id: string;
    verse: string;
    contents: any;
}

/**
 * A React component to display a singke passage.
 *
 * @param {PassageProps} props - The properties passed to the component.
 *   - TODO
 *
 * @returns {JSX.Element} A JSX Element of a `span` containing the scripture.
*/
function Passage({ contents, usfm, ignoreFootnotes, renderMode, loadPassage, translation, docID, selectedNoteGroup }: PassageProps): JSX.Element {

    const [formattedContent, setFormattedContent]: [any[], Function] = useState([]);
    const [passage, setPassage]: [JSX.Element, Function] = useState(<></>);

    const [notesContents, setNotesContents]: [any, (a: any) => void] = useState([]);
    const [selectedVerse, setSelectedVerse]: [any, (a: any) => void] = useState(null);

    const shouldLoad = (contents !== null && contents !== undefined);
    const shouldLoadNotes = (shouldLoad && selectedNoteGroup !== undefined);

    useEffect(() => {
        if (shouldLoad) {
            formatContents();

            if (shouldLoadNotes) {
                void loadPassageNotes(selectedNoteGroup, `${usfm.book}`, `${usfm.initialChapter}`);
            }
        }
    }, [contents]);

    useEffect(() => {
        if (shouldLoadNotes) {
            void loadPassageNotes(selectedNoteGroup, `${usfm.book}`, `${usfm.initialChapter}`);
        }
    }, [selectedNoteGroup]);

    useEffect(() => {
        if (formattedContent) {
            renderPassage();
        }
    }, [formattedContent, notesContents, renderMode]);

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
        const saveResult = await window.electronAPI.saveNote(`${id}`, selectedNoteGroup, usfm.book, String(usfm.initialChapter), newNoteContents);
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
        window.electronAPI.deleteNote(`${id}`, selectedNoteGroup, usfm.book, String(usfm.initialChapter));
    }

    function createNewNote(id: string, selectedNoteGroup: string): void {

        const newNoteContents: Note = {
            id,
            verse: selectedVerse,
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

        window.electronAPI.saveNote(`${id}`, selectedNoteGroup, usfm.book, String(usfm.initialChapter), newNoteContents);
    }

    // DYNAMICALLY GENERATE PASSAGE
    /**
     * Format the contents (array of chapters, a map of verses) into an array of formatted paragraphs.
     */
    function formatContents(): void {

        // split content into paragraphs
        const formattedContent: any[] = [];
        contents.forEach((chapter: any) => { // iterate through chapters

            Object.entries(chapter).forEach(([verseNumber, verse]: any) => { // iterate through verses

                if (!Array.isArray(verse)) { // TODO; convert below code to function and use that instead
                    verse = [verse];
                }

                // content
                verse.forEach((subsection: any, subsectionNumber: Number) => { // iterate through paragraphs

                    // header
                    if (subsection.header) {
                        formattedContent.push({ "type": "s", "content": subsection.header }); // TODO handle Psalms better
                        // remove header from this section, as it is now its own element
                        subsection = { ...subsection};
                        delete subsection.header;
                    }

                    // verse numbers
                    if (subsectionNumber === 0) { // this is the first subsection of the verse, so a add verse number

                        const label = (subsection.chapter) ? { "type": "label chapter", "content": subsection.chapter } : { "type": "label", "content": verseNumber };

                        // paragraph
                        if (subsection.type) {
                            const paraType = isOfParagraphType(subsection.type);
                            if (paraType) { // new paragraph
                                // add type to label, remove
                                label.type += ` ${paraType}`;
                                // remove type from subsection, as the verse label now handles it
                                subsection = { ...subsection};
                                subsection.type = subsection.type.replace(new RegExp(`\\s*${paraType}\\s*`, 'g'), '')
                            }
                        }

                        formattedContent.push(label);
                    }

                    subsection.id = `${usfm.book}.${usfm.initialChapter}.${verseNumber}`; // TODO; rename 'verse'->'initialVerse' //TODO support multiple chapters //TODO initialChapter is wrong
                    // section.token = undefined; // TODO
                    formattedContent.push(subsection);

                });

            });
        });
        setFormattedContent(formattedContent);

    }

    /**
     * Render the passage (JSX.Element[]) from the formatted content.
     */
    function renderPassage(): void {

        const passageElements: JSX.Element[] = [];

        if (ignoreFootnotes || renderMode === 'sidenotes') {
            passageElements.push(
                <PassageChunk
                    contents={formattedContent} ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={usfm.book} passageChapter={usfm.chapter} translation={translation} passageNotes={notesContents} setSelectedVerse={setSelectedVerse} renderMode={renderMode} // TODO
                />
            );
        }
        else if (renderMode === 'interlinear') {

            // GET SPLIT POINTS
            // calculate the start and end of each section we need to annotate
            const splitPointsMap: any = {};
            for (const note of notesContents) {
                splitPointsMap[note.verse] = {};
            }
            for (let i = 0; i < formattedContent.length; i++) { // iterate over all verse subsections

                if (formattedContent[i].id) {
                    for (const note of notesContents) {
                        const annotation = note.verse;

                        if (formattedContent[i].id === annotation) {
                            if (splitPointsMap[annotation]['start'] === undefined) {
                                splitPointsMap[annotation]['start'] = (formattedContent[i-1].type.includes('label')) ? i-1 : i;
                            }
                            splitPointsMap[annotation]['end'] = i;
                        }

                    }
                }
            }
            const splitPoints: any[] = Object.entries(splitPointsMap);

            // RENDER
            // split the formatted content into chunks
            let formattedContentChunk: JSX.Element[] = [];
            let splitPoint = splitPoints.shift(); // TODO this assumes there is no overlap between notes
            for (let i = 0; i < formattedContent.length; i++) {
                if (splitPoint) {
                    if (i === splitPoint[1].start) { // START

                        // add currently collected unannotated chunk
                        passageElements.push(
                            <PassageChunk
                                contents={formattedContentChunk}
                                ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={usfm.book} passageChapter={usfm.chapter} translation={translation} passageNotes={notesContents} setSelectedVerse={setSelectedVerse} renderMode={renderMode}
                            />
                        );

                        // begin collecting the new chunk
                        formattedContentChunk = [];
                    }

                    // add to chunk
                    formattedContentChunk.push(formattedContent[i]);

                    if (i === splitPoint[1].end) { // END

                        // add currently collected annotated chunk
                        passageElements.push(
                            <PassageChunk
                                contents={formattedContentChunk}
                                ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={usfm.book} passageChapter={usfm.chapter} translation={translation} passageNotes={notesContents} setSelectedVerse={setSelectedVerse} renderMode={renderMode}
                            />
                        );

                        // note
                        const note = notesContents.find((note: any) => note.verse === splitPoint[0]);

                        const noteContent = (<NoteContent
                            sidenoteID={note.verse} passageName={note.verse} docID={docID} initialNoteContents={note.contents}
                            updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote}
                        />);
                        passageElements.push(<div>{noteContent}</div>);

                        // watch for next split point
                        splitPoint = splitPoints.shift();
                        formattedContentChunk = [];

                    }
                }
                else {
                    // there are no more split points, so just add the rest of the content
                    formattedContentChunk.push(formattedContent[i]);
                }
            }
            passageElements.push(
                <PassageChunk
                    contents={formattedContentChunk}
                    ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={usfm.book} passageChapter={usfm.chapter} translation={translation} passageNotes={notesContents} setSelectedVerse={setSelectedVerse} renderMode={renderMode}
                />
            );

        }

        setPassage(<>{passageElements}</>);
        console.log(passageElements);

    }

    function handleUpdateNotesContents(id: string, verse: string, noteContent: string, callback?: Function): void { // TODO share this with PassageChunk
        if (updateNotesContents && selectedNoteGroup)
            updateNotesContents(id, verse, selectedNoteGroup, noteContent, callback);
    }

    function handleDeleteNote(id: string): void { // TODO share this with PassageChunk
        if (deleteNote && selectedNoteGroup)
            deleteNote(id, selectedNoteGroup);
    }

    // async function expandPassage(delta: number): Promise<void> {
    //     // get next chapter
    //     const historyStack = historyStacks[0]
    //     const usfm = getUSFM(historyStack[historyStack.length - 1])[0]; // TODO; TEMP

    //     let extraChapter = usfm.finalChapter ? usfm.finalChapter : usfm.initialChapter
    //     extraChapter = Number(extraChapter) + delta

    //     const fileName = `${usfm.book}.${extraChapter}`
    //     const chapterContents = await window.electronAPI.loadScripture(fileName, selectedTranslation);
    //     if (chapterContents) {
    //         chapterContents[0][0].chapter = extraChapter;
    //     }

    //     // truncate up to next heading
    //     let extraContents = [];

    //     const start = (delta === 1 ? 0 : chapterContents.length - 1)

    //     for (let i = start; (i < chapterContents.length && i >= 0); i += delta) {

    //         if (i !== 0) {
    //             if (chapterContents[i].header) {
    //                 if (delta === -1) {
    //                     extraContents.push(chapterContents[i]);
    //                 }
    //                 break;
    //             }
    //             if (chapterContents[i][0]?.header) {
    //                 if (delta === -1) {
    //                     extraContents.push(chapterContents[i]);
    //                 }
    //                 break;
    //             }
    //         }
    //         extraContents.push(chapterContents[i]);

    //     }

    //     //TODO; fix
    //     // generate passage and merge into current
    //     if (delta === 1) {
    //         const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter + 1)); //TODO; we cannot always assume this will be initialChapter+1

    //         setPassages(<>{passages}{extraPassageContents}</>);
    //     }
    //     else { // TODO; fix verse numbers
    //         extraContents = extraContents.reverse()
    //         extraContents[0][0].verse = (chapterContents.length + 1) - extraContents.length;
    //         const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter - 1));

    //         setPassages(<>{extraPassageContents}{passages}</>);
    //     }
    // }

    // TOOO; better way to do this

    return (<>
        <AnchorBase anchor={baseAnchor} className="base">
            {/* <button onClick={() => expandPassage(-1)} hidden={historyStacks[0].length === 0} className='btn btn-default ellipsis'>...</button><br/> */}
            {passage}
            {/* <button onClick={() => expandPassage(1)} hidden={historyStacks[0].length === 0} className='btn btn-default ellipsis'>...</button> */}
        </AnchorBase>

        {(!ignoreFootnotes && shouldLoadNotes && renderMode === 'sidenotes')
            ? <>
                <SidenotesContainer
                    position=''
                    passage={`${usfm.book}.${usfm.chapter}`} notesContents={notesContents} selectedNoteGroup={selectedNoteGroup} docID={docID}
                    createNewNote={createNewNote} updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote}
                />
                {/* <SidenotesContainer
                    position=' l'
                    passage={`${usfm.book}.${usfm.chapter}`} notesContents={notesContents} selectedNoteGroup={selectedNoteGroup} docID={docID}
                    createNewNote={createNewNote} updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote}
                /> */}
            </>
            : null
        }
    </>);

}

export default Passage;
