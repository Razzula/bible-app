import React, { useState } from 'react';
import { Store, Sidenote, InlineAnchor, AnchorBase } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { useStore } from 'react-redux';
import { OverlayTrigger, Alert, Popover } from 'react-bootstrap';

import 'sidenotes/dist/sidenotes.css';
import '../styles/dark.scss';
import '../styles/sidenotes.scss';
import '../styles/bible.scss';
import '../styles/App.scss';

const books = require('./books.json');

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

type Scripture = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any
}

function Scripture({ contents, ignoreFootnotes, loadPassage }: Scripture) {

    //presence check
    if (contents == null) {
        return (
            <>
                <Alert variant="danger">
                    <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
                    <p>
                        Change this and that and try again.
                    </p>
                    {/* <hr />
                    <p className="mb-0">
                        Change this and that and try again.
                    </p> */}
                </Alert>
            </>
        );
    }

    // DYNAMICALLY GENERATE BIBLE CONTENTS
    // split content into paragraphs
    var paragraphs = new Array();
    let temp = new Array();

    let v = 1;
    for (let i = 0; i < contents.length; i++) { //iterate through verses

        //content
        for (let ii = 0; ii < contents[i].length; ii++) { //iterate through verse sections
            let section = contents[i][ii];
            
            if (section.type == 'p' || section.type == 'q1' || section.type == 'q2') { //new paragraph
                if (temp.length != 0) { //store previous sections as a paragraph
                    paragraphs.push(temp);
                }
                temp = new Array(); //begin new paragraph
            }
            //header
            if (section.header != null) {
                paragraphs.push([{"type":"s", "content":section.header}]);
            }
            
            //verse numbers
            if (ii == 0) {
                if (section['verse']) {
                    v = section['verse'];
                }
                if (section['chapter']) {
                    // use chapter number instead of verse
                    temp.push({"type":"label chapter", "content":section['chapter']});
                }
                else {
                    temp.push({"type":"label", "content":v+i});
                }   
            }
            
            section['test'] = ' v'+(v+i); //TODO; rename 'verse'->'initialVerse', 'test'->'verse'
            temp.push(section);
        };
    }
    paragraphs.push(temp);

    // format paragraphs
    const content = paragraphs.map((paragraph: Array<{type:string, content:string, test:string}>) => {

        // format contents of paragraph
        const paraContent = paragraph.map((item) => {
            //footnotes
            if (item.type == 'note') {
                if (ignoreFootnotes) {
                    return;
                }

                return (
                    <Note contents={item.content} loadPassage={loadPassage} />
                );
            }

            //labels
            if (item.type == 'label') {
                return (
                    <span className={item.type} id={'v'+item.content}>{item.content}</span> //can use scrollIntoView() to jump to verse
                );
            }
            if (item.type == 'label chapter') {
                return (
                    <span className={item.type} id={'v1'}>{item.content}</span> //can use scrollIntoView() to jump to verse
                );
            }
    
            //other formatting
            return (
                <span className={item.type+' '+item.test}>{item.content}</span>
            );
        });

        let paraType = paragraph[0].type
        if (paraType.startsWith('label')) {
            paraType = paragraph[1].type
        }

        return (
            <>
                <div className={paraType}>
                    {paraContent}
                </div>
            </>
        );
    });

    //TODO; work out how to use <InLineAnchor>s with this new system

    return (<>{content}</>);
}

type Note = {
    contents: string;
    loadPassage: any;
}

function Note({ contents, loadPassage }: Note) {
    const [noteContents, setNoteContents]: [any, any]  = useState();

    //detect references
    const pattern = RegExp(/((?:[123]+ )?[A-z]+)\.?\s*(\d+)(?::\s*(\d+)(?:\s*-(\d+))?)?/g);
    let match;
    let matches = new Array();

    while ((match = pattern.exec(contents)) !== null) { //get positions of references
        matches.push([match.index, pattern.lastIndex]);
    }

    let data = new Array();

    //extract references
    let i;

    if (matches[0][0] != 0) { //prevent pushing ''  
        data.push([contents.slice(0, matches[0][0]), false]);
    }
    for (i= 0; i < matches.length; i++) {

        data.push([contents.slice(matches[i][0], matches[i][1]), true]); //reference

        if (i < matches.length-1) { 
            data.push([contents.slice(matches[i][1], matches[i+1][0]), false]); //post-reference
        }
        
    }
    if (matches[i-1][1] != contents.length) { //prevent pushing ''  
        data.push([contents.slice(matches[i-1][1], contents.length), false]);
    }

    //popver with passage
    const innerPopover = (
        <Popover id="popover-basic">
            <Popover.Body>
                {/* {ref[0]} */}
                <Scripture contents={noteContents} ignoreFootnotes />
            </Popover.Body>
        </Popover>
    );
    //format references
    const references = data.map((ref) => {
        if (ref[1]) {

            //contents of footnote popover
            return (
                <>
                <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={innerPopover}>
                    <span className='ref external' onMouseEnter={updatePopoverContents} onClick={() => loadPassage(ref[0])}>{ref[0]}</span>
                </OverlayTrigger>
                </>
            );

            async function updatePopoverContents() {
                //TODO; prevent multiple reads of same file
                let usfm  = getUSFM(ref[0]);
                let fileName = usfm['book']+'.'+usfm['initialChapter'];
                let passageContents = await window.electronAPI.openFile(fileName);

                if (!passageContents) {
                    setNoteContents(null);
                    return;
                }

                //trim to specific verses
                let initalVerse = 1, finalVerse = passageContents.length

                if (usfm['initialVerse']) {
                    initalVerse = usfm['initialVerse'];

                    if (usfm['finalVerse']) {
                        finalVerse = usfm['finalVerse'];
                    }
                    else {
                        finalVerse = initalVerse;
                    }
                }

                passageContents = passageContents.slice(initalVerse-1, finalVerse);
                passageContents[0][0]['verse'] = initalVerse;

                setNoteContents(passageContents);
            }
        }
        return ref;
    });

    //popover with footnote contents
    const footnotePopover = (
        <Popover id="popover-basic">
            <Popover.Body>
                {references}
            </Popover.Body>
        </Popover>
    );
    
    //footnote
    return (
        <OverlayTrigger trigger="click" rootClose placement="top" overlay={footnotePopover}>
            <span className="note"/>
        </OverlayTrigger>
    );

}

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
            const chapterContents = await window.electronAPI.openFile(fileName); //TODO; invalid name crashes app
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

function getUSFM(reference: string) {

    const match = reference.toUpperCase().match(/((?:[123]+ ?)?[A-z]+)\.?\s*(\d+)(?::\s*(\d+)(?:\s*-(\d+))?|-(\d+))?/); //NOT GLOBAL

    if (!match) { //invalid format
        return null;
    }

    let usfm: any = {};
    match[1] = match[1].replace(/\s+/, '');
    books.forEach((book: (string[])) => {
        if (book.includes(match[1])) {
            console.log(book);
            usfm['book'] = book[0];
        }
    });

    usfm['initialChapter'] = match[2];
    usfm['initialVerse'] =  Number(match[3]);
    usfm['finalVerse'] = Number(match[4]);
    usfm['finalChapter'] = Number(match[5]);

    console.log(usfm);
    return usfm;
}

//TODO; back and forward functions

export default App;