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
const blue = 'blue';
const red = 'red';

function App() {
    //TODO; better initial values (currently an error)
    const [searchQuery, setSearchQuery] = useState('');
    const [chaptersContents, setChaptersContents]: [any, any] = useState([null]);
    var currentFileName: string;

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
            const chapterContents = await window.electronAPI.openFile(fileName); //TODO; single-chapter books
            chaptersContents.push(chapterContents);
    
        }

        setChaptersContents(chaptersContents);
        setSearchQuery(searchQuery);
        
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

    const passageContents = chaptersContents.map((chapterContents: any, i: Number) => {
        if (i !== chaptersContents.length - 1) {
            return (
                <>
                <Scripture contents={chapterContents} loadPassage={loadPassage}/>
                <hr/>
                </>
            );
        }
        return (<Scripture contents={chapterContents} loadPassage={loadPassage}/>);
    });

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
                            <Sidenote sidenote={blue} base={baseAnchor}>
                                <div style={{ width: 280, height: 150}}>
                                    <textarea defaultValue='Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum numquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium optio, eaque rerum! Provident similique accusantium nemo autem.'/>
                                </div>
                            </Sidenote>
                            <Sidenote sidenote={red} base={baseAnchor}>
                                <div style={{ width: 280, height: 100}}>right-hand note</div>
                            </Sidenote>
                        </div>

                        <div className="sidenotes l">
                            <Sidenote sidenote={blue} base={baseAnchor}>
                                <div style={{ width: 280, height: 100}}>left-hand note</div>
                            </Sidenote>
                        </div>

                </article>
            </div>

        </>
    );
}

//TODO; back and forward functions

export default App;