import React, { useState } from 'react';
import { Store, Sidenote, InlineAnchor, AnchorBase } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { useStore } from 'react-redux';

import { getUSFM }  from '../src/common';

import Scripture from './components/Scripture';

import 'sidenotes/dist/sidenotes.css';
import '../styles/dark.scss';
import '../styles/sidenotes.scss';
import '../styles/App.scss';

declare global {
    interface Window {
        [index: string]: any;
    }
}

var store: Store;

const docId = 'article';
const baseAnchor = 'anchor';

function App() {
    //TODO; better initial values (currently an error)
    const [searchQuery, setSearchQuery] = useState('');
    const [passageContents, setPassageContents]: [Array<any>, any] = useState([]);
    // var currentFileName: string;
    const [tempNotesContents, setTempNotesContents]: [Array<any>, any] = useState([null]);

    store = useStore();
    const deselect = () => store.dispatch(deselectSidenote(docId));
    
    function handleClick() {
        loadPassage(searchQuery);
    }

    function handleChange(event: React.ChangeEvent<any>) {
        setSearchQuery(event.currentTarget.value);
    }

    async function loadPassage(searchQuery: string) {

        let chaptersContents = new Array();
        
        let usfm = getUSFM(searchQuery);
        if (!usfm) {
            return;
        }

        let chapterRange;
        if (usfm['finalChapter']) {
            chapterRange =  usfm['finalChapter'];
        }
        else {
            chapterRange = usfm['initialChapter']
        }
        
        //load chapters from files
        for (let chapter = usfm['initialChapter']; chapter <= chapterRange; chapter++) {
            let fileName = usfm['book']+'.'+chapter;
            
            if (!fileName) { //invalid
                continue;
            }
            // if (fileName == currentFileName) { //prevent multiple reads of current file
            //     return;
            // }
            // currentFileName = fileName;
            
            // load contents externally from files
            const chapterContents = await window.electronAPI.readFile(fileName,"Scripture/NKJV"); //TODO; single-chapter books //TODO; make NKJV
            if (chapterContents) {
                chapterContents[0][0]['chapter'] = chapter;
            }
            chaptersContents.push(chapterContents);

            loadPassageNotes(fileName);
    
        }

        const passageContents = chaptersContents.map((chapterContents: any, i: Number) => {
            if (i !== chaptersContents.length - 1) { //there is a subsequent chapter
                return (
                    <>
                    <Scripture contents={chapterContents} loadPassage={loadPassage}/>
                    <hr/>
                    </>
                );
            }
            return (<Scripture contents={chapterContents} loadPassage={loadPassage}/>);
        });

        setPassageContents(passageContents);
        setSearchQuery(searchQuery); //TODO; format, e.g 'gen1' --> 'Genesis 1'
        
        //scroll to verse if specified
        if (usfm['initialVerse']) { //might need to move into state

            let range;
            if (usfm['finalVerse']) {
                range = usfm['finalVerse'];
            }
            else {
                range = usfm['initialVerse'];
            }

            //jump to passage
            const element = document.getElementById('v'+(usfm['initialVerse']-1)); //TEMP; -1 prevents verse going all the way to top
            if (element) {
                element.scrollIntoView();
            }
            else {
                document.getElementById(docId)?.scrollIntoView(); //goto top
            }

            //highlight passage
            for (let verse = usfm['initialVerse']; verse <= range; verse++) {

                const elements = document.getElementsByClassName('v'+verse);
                for(let i = 0; i < elements.length; i++) {
                    const element = elements[i] as HTMLElement;
                    element.classList.remove('blink');
                    element.offsetWidth; //allow repetition
                    element.classList.add('blink');
                }

            }

        }
        else {
            document.getElementById(docId)?.scrollIntoView(); //goto top
        }
    }

    async function loadPassageNotes(fileName: string) {

        const chapterNotes = await window.electronAPI.readFile(fileName,"notes");

        if (chapterNotes) {

            const notesContents = chapterNotes.map((noteContents: any) => {
                console.log(noteContents);
                if (noteContents) {
                    return (
                        <Sidenote sidenote={noteContents.verse} base={baseAnchor}>
                            <div style={{ width: 280, height: 150}}>
                                <textarea>
                                    {noteContents.contents}
                                </textarea>
                            </div>
                        </Sidenote>
                    );
                }
            });

            setTempNotesContents(notesContents);
        }
        else {
            setTempNotesContents(null);
        }
        
        deselect();

    }

    //GENERATE JSX
    return (
        <>

            {/* BANNER */}
            <div className="input-group">
                <input type="text" value={searchQuery} className="form-control" onChange={handleChange} onKeyDown={(e) => e.key === 'Enter' && handleClick()}/>
                <button className='btn btn-default' onClick={handleClick}>Load</button>
            </div>

            <div className='scroll'>
                <article id={docId} onClick={deselect}>
                    
                        {/* BIBLE */}
                        <AnchorBase anchor={baseAnchor} className="base">

                            {/*content /* autofill from JSON */}
                            {passageContents}

                        </AnchorBase>
                        <p className="notice">Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.</p>

                        {/* SIDENOTES */} {/* TODO; generate dynamically */}
                        <div className="sidenotes">

                            {tempNotesContents}

                            {/* <Sidenote sidenote='testR' base={baseAnchor}>
                                <div style={{ width: 280, height: 100}}>right-hand note</div>
                            </Sidenote> */}
                        </div>

                        <div className="sidenotes l">
                            {/* <Sidenote sidenote='testL' base={baseAnchor}>
                                <div style={{ width: 280, height: 100}}>left-hand note</div>
                            </Sidenote> */}
                        </div>

                </article>
            </div>

        </>
    );
}

//TODO; back and forward functions

export default App;