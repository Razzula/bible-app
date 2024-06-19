import { FloatingFocusManager, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnchorBase } from 'sidenotes';

import { setActiveToken } from '../../redux/actions';
import { RootState } from '../../redux/rootReducer';
import FileManager from '../../utils/FileManager';
import { isOfParagraphType } from '../../utils/general';
import NoteEditor from './NoteEditor';
import PassageChunk from './PassageChunk';
import SidenotesContainer from './SidenotesContainer';

import defaultNoteContents from '../../../../public/defaultNote.json';

import 'sidenotes/dist/sidenotes.css';
import '../../styles/Bible.scss';
import '../../styles/sidenotes.scss';

const baseAnchor = 'anchor';

type PassageProps = {
    contents: any;
    usfm: any;
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
    tokens: string[];
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
    // TODO: (BIBLE-98) create a lightwight version of the Passage component, which only renders the passage, without any notes or interactions (this will be used by the references)
    // furthermore, redux should not be used in this component, as these will be mounted in the references, which are not connected to the store

    const [formattedContent, setFormattedContent]: [any[], Function] = useState([]);
    const [passage, setPassage]: [JSX.Element, Function] = useState(<></>);

    const [notesContents, setNotesContents]: [any, (a: any) => void] = useState([]);
    const selectedToken = useSelector((state: RootState) => state.passage.activeToken);

    const shouldLoad = (contents !== null && contents !== undefined);
    const shouldLoadNotes = (shouldLoad && selectedNoteGroup !== undefined);

    const fileManager = FileManager.getInstance();
    const dispatch = useDispatch();

    // popover for token selection
    const [tokenPopoverIsOpen, setTokenPopoverIsOpen] = useState(false);
    const { refs: tokenFloatRefs, floatingStyles: tokenFloatStyles, context: tokenFloatContext } = useFloating({
        open: tokenPopoverIsOpen,
        onOpenChange: setTokenPopoverIsOpen,
        placement: 'top',
        middleware: [offset(10), flip(), shift()],
        whileElementsMounted: autoUpdate,
    });

    useEffect(() => {
        if (selectedToken === null) {
            setTokenPopoverIsOpen(false);
        }
    }, [selectedToken]);

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

        const rawNotesContents: [] = await fileManager.loadNotes(group, book, chapter);

        if (rawNotesContents) {
            setNotesContents(rawNotesContents);
        }
    }

    // HANDLE NOTES
    async function updateNotesContents(id: string, tokens: string[], selectedNoteGroup: string, noteContent: string, callback?: Function): Promise<void> {

        const newNoteContents = {
            tokens,
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
        const saveResult = await fileManager.saveNote(`${id}`, selectedNoteGroup, usfm.book, String(usfm.initialChapter), newNoteContents);
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
        fileManager.deleteNote(`${id}`, selectedNoteGroup, usfm.book, String(usfm.initialChapter));
    }

    function createNewNote(id: string, selectedNoteGroup: string): void {

        if (selectedToken === null) {
            return;
        }

        const newNoteContents: Note = {
            id,
            tokens: [selectedToken],
            contents: defaultNoteContents['contents']
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

        fileManager.saveNote(`${id}`, selectedNoteGroup, usfm.book, String(usfm.initialChapter), newNoteContents);
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

                if (!Array.isArray(verse)) {
                    verse = [verse];
                }

                // content
                verse.forEach((subsection: any, subsectionNumber: Number) => { // iterate through paragraphs

                    // header
                    if (subsection.header) {
                        formattedContent.push({ "type": "s", "content": subsection.header }); // TODO: (BIBLE-88) handle Psalms better
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

                    subsection.id = `${usfm.book}.${usfm.initialChapter}.${verseNumber}`; //TODO: initialChapter is wrong
                    // section.token = undefined; // TODO: (BIBLE-101)
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
                    contents={formattedContent} ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={usfm.book} passageChapter={usfm.chapter} translation={translation} passageNotes={notesContents} renderMode={renderMode}
                    handleTokenSelected={handleTokenSelected}
                />
            );
        }
        else if (renderMode === 'interlinear') {

            // GET ANNOTATION BOUNDS
            // calculate the start and end of each section we need to annotate
            const notesBounds: any = {};
            for (const note of notesContents) {
                // instantiate the object ready so that bounds can be written directly, without presence checking
                notesBounds[note.id] = {};
            }
            for (let i = 0; i < formattedContent.length; i++) { // iterate over all verse subsections

                if (formattedContent[i].id) {
                    for (const note of notesContents) {
                        const noteID = note.id;

                        if (note.tokens !== undefined && note.tokens.some((token: string) => token === formattedContent[i].id)) {
                            // this is an occurence of an annotation
                            if (notesBounds[noteID]['start'] === undefined) {
                                // we only mark the start on the first seen occurence
                                notesBounds[noteID]['start'] = (formattedContent[i-1].type.includes('label')) ? i-1 : i;
                            }
                            // mark this as the end: this will eventually be overwritten with the true end
                            notesBounds[noteID]['end'] = i;
                        }

                    }
                }
            }

            // GET SPLIT POINTS
            // we assume there is no overlap between notes
            // we assume that there are no notes sharing a boundary
            // TODO: (BIBLE-102) handle overlap
            const splitPoints: any = {};
            Object.entries(notesBounds).forEach(([token, bounds]: any) => {
                if (splitPoints[bounds.end] === undefined || splitPoints[bounds.end] === null) {
                    splitPoints[bounds.end] = [token];
                }
                else {
                    // append to existing list
                    splitPoints[bounds.end] = [...splitPoints[bounds.end], token];
                }

                if (splitPoints[bounds.start] === undefined) {
                    // this state is only tracked if there is nothing else tracked for this point
                    splitPoints[bounds.start] = null;
                }
            });

            // RENDER
            // split the formatted content into chunks
            let formattedContentChunk: JSX.Element[] = [];
            for (let i = 0; i < formattedContent.length; i++) {

                const splits = splitPoints[i];
                if (splits === null) {
                    // this is a split point (start of a bound)
                    // TODO: currently, there is no need to handle this, as we are only interested in the end of bounds
                    // note: this may change at some point
                    formattedContentChunk.push(formattedContent[i]);
                }
                else if (splits !== undefined) {
                    // this is a split point (end of a bound)
                    // add to chunk
                    formattedContentChunk.push(formattedContent[i]);

                    // END CHUNK
                    // add currently collected annotated chunk
                    passageElements.push(
                        <PassageChunk
                        contents={formattedContentChunk} ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={usfm.book} passageChapter={usfm.chapter} translation={translation} passageNotes={notesContents} renderMode={renderMode}
                        handleTokenSelected={handleTokenSelected}
                        />
                    );
                    formattedContentChunk = [];

                    // INSERT NOTE(S)
                    splits.forEach((split: string) => {
                        const note = notesContents.find((note: any) => note.id === split);

                        const noteContent = (<NoteEditor
                            sidenoteID={note.id} tokens={note.tokens} docID={docID} initialNoteContents={note.contents}
                            currentBook={usfm.book} translation={translation}
                            loadPassage={loadPassage} updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote}
                        />);
                        passageElements.push(<div>{noteContent}</div>);
                    });
                }
                else {
                    // not a split point, so just add to chunk
                    formattedContentChunk.push(formattedContent[i]);
                }
            }
            passageElements.push(
                <PassageChunk
                    contents={formattedContentChunk} ignoreFootnotes={ignoreFootnotes} loadPassage={loadPassage} passageBook={usfm.book} passageChapter={usfm.chapter} translation={translation} passageNotes={notesContents} renderMode={renderMode}
                    handleTokenSelected={handleTokenSelected}
                />
            );

        }

        setPassage(<>{passageElements}</>);

    }

    function handleUpdateNotesContents(id: string, tokens: string[], noteContent: string, callback?: Function): void {
        if (updateNotesContents && selectedNoteGroup)
            updateNotesContents(id, tokens, selectedNoteGroup, noteContent, callback);
    }

    function handleDeleteNote(id: string): void {
        if (deleteNote && selectedNoteGroup)
            deleteNote(id, selectedNoteGroup);
    }

    // async function expandPassage(delta: number): Promise<void> {
    //     // get next chapter
    //     const historyStack = historyStacks[0]
    //     const usfm = getUSFM(historyStack[historyStack.length - 1])[0]; // TODO:  TEMP

    //     let extraChapter = usfm.finalChapter ? usfm.finalChapter : usfm.initialChapter
    //     extraChapter = Number(extraChapter) + delta

    //     const chapterContents = await fileManager.loadScripture(usfm.book, usfm.chapter, selectedTranslation);
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

    //     //TODO:  fix
    //     // generate passage and merge into current
    //     if (delta === 1) {
    //         const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter + 1)); //TODO:  we cannot always assume this will be initialChapter+1

    //         setPassages(<>{passages}{extraPassageContents}</>);
    //     }
    //     else { // TODO:  fix verse numbers
    //         extraContents = extraContents.reverse()
    //         extraContents[0][0].verse = (chapterContents.length + 1) - extraContents.length;
    //         const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter - 1));

    //         setPassages(<>{extraPassageContents}{passages}</>);
    //     }
    // }

    function handleTokenSelected(token: string, ref: any): void {
        dispatch(setActiveToken(token));
        tokenFloatRefs.setReference(ref);
        setTokenPopoverIsOpen(ref !== null);
    }

    function handleNewNoteClick(): void {
        if (selectedNoteGroup) {
            const id = crypto.randomUUID();
            createNewNote(id, selectedNoteGroup);
        }
    }

    return (
        <>
            <AnchorBase anchor={baseAnchor} className="base">
                {/* <button onClick={() => expandPassage(-1)} hidden={historyStacks[0].length === 0} className='btn btn-default ellipsis'>...</button><br/> */}
                {passage}
                {/* <button onClick={() => expandPassage(1)} hidden={historyStacks[0].length === 0} className='btn btn-default ellipsis'>...</button> */}
            </AnchorBase>

            {(!ignoreFootnotes && shouldLoadNotes && renderMode === 'sidenotes')
                ? <>
                    <SidenotesContainer
                        position=''
                        passage={`${usfm.book}.${usfm.chapter}`} notesContents={notesContents} docID={docID}
                        currentBook={usfm.book} translation={translation}
                        loadPassage={loadPassage} updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote}
                    />
                    {/* <SidenotesContainer
                        position=' l'
                        passage={`${usfm.book}.${usfm.chapter}`} notesContents={notesContents} docID={docID}
                        updateNotesContents={handleUpdateNotesContents} deleteNote={handleDeleteNote}
                    /> */}
                </>
                : null
            }

            {tokenPopoverIsOpen && (
                <FloatingFocusManager context={tokenFloatContext} modal={false}>
                    <div ref={tokenFloatRefs.setFloating} style={tokenFloatStyles}>
                        {/* NEW NOTE BUTTON */}
                        <button className='btn btn-default' onClick={handleNewNoteClick}>
                        <img src='/bible-app/icons/noteCreate.svg' alt='Create Note'/>
                        </button>
                    </div>
                </FloatingFocusManager>
            )}
        </>
    );

}

// function AnnotationPopover({ token, context, }: any): JSX.Element {
// }

export default Passage;
