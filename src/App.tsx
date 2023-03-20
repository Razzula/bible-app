import React, { useState } from 'react';
import { Store, Sidenote, InlineAnchor, AnchorBase } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { useStore } from 'react-redux';
import { OverlayTrigger, Alert, Popover } from 'react-bootstrap';

import 'sidenotes/dist/sidenotes.css';
import '../styles/dark.scss';
import '../styles/sidenotes.scss';
import '../styles/bible.scss'

// const fs = require('fs');
// const pathModule = require('path');
// const { app } = require('@electron/remote');

declare global {
    interface Window {
        [index: string]: any;
    }
}

// async function test() {
//     console.log('here');
//     const filePath = await window.electronAPI.openFile();
//     console.log(filePath);
// }
// test();

var store: Store;

const docId = 'article';
const baseAnchor = 'anchor';
const blue = 'blue';
const red = 'red';

type Scripture = {
    contents: any;
}

function Scripture({ contents }: Scripture) {

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
                if (i == 0) {
                    temp.push({"type":"label chapter", "content":i+1});
                }
                else {
                    temp.push({"type":"label", "content":i+1});
                }   
            }
            
            temp.push(section);
        };
    }
    paragraphs.push(temp);

    // format paragraphs
    const content = paragraphs.map((paragraph: Array<{type:string, content:string}>) => {

        // format contents of paragraph
        const paraContent = paragraph.map((item) => {
            //footnotes
            if (item.type == 'note') {

                //detect references
                const pattern = RegExp(/(?:[123]+ )?[A-z]+\.? ?\d+(?:: ?\d+ ?)?/g);
                let match;
                let matches = new Array();

                while ((match = pattern.exec(item.content)) !== null) { //get positions of references
                    matches.push([match.index, pattern.lastIndex]);
                }

                let data = new Array();

                //extract references
                let i;

                if (matches[0][0] != 0) { //prevent pushing ''  
                    data.push([item.content.slice(0, matches[0][0]), false]);
                }
                for (i= 0; i < matches.length; i++) {

                    data.push([item.content.slice(matches[i][0], matches[i][1]), true]); //reference

                    if (i < matches.length-1) { 
                        data.push([item.content.slice(matches[i][1], matches[i+1][0]), false]); //post-reference
                    }
                    
                }
                if (matches[i-1][1] != item.content.length) { //prevent pushing ''  
                    data.push([item.content.slice(matches[i-1][1], item.content.length), false]);
                }

                //format references
                //TODO; popver with passage
                const references = data.map((ref) => {
                    if (ref[1]) {
                        return <span className='ref external'>{ref}</span>;
                    }
                    return ref;
                });

                //create popover
                const popover = (
                    <Popover id="popover-basic">
                        <Popover.Body>
                            {references}
                        </Popover.Body>
                    </Popover>
                );
                
                return (
                    <OverlayTrigger trigger="click" rootClose placement="top" overlay={popover}>
                        <span className="note"/>
                    </OverlayTrigger>
                );
            }
    
            //other formatting
            return (
                <span className={item.type}>{item.content}</span>
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

function App() {
    //TODO; better initial values (currently an error)
    const [passageName, setPassageName] = useState('');
    const [passageContents, setPassageContents]: [any, any] = useState(null);

    store = useStore();
    const deselect = () => store.dispatch(deselectSidenote(docId));
    
    async function handleClick() {
        // load contents externally from files
        //TODO; better comprehension (Genesis 3 ==> GEN.3), allow chapter-spanning and verse specification
        const passageContents = await window.electronAPI.openFile(passageName);
        setPassageContents(passageContents);
    }

    function handleChange(event: React.ChangeEvent<any>) {
        setPassageName(event.currentTarget.value);
    }

    return (
        <>
            <article id={docId} onClick={deselect}>
                
                {/* BANNER */}
                <div className="input-group">
                    <input type="text" className="form-control" onChange={handleChange} onKeyDown={(e) => e.key === 'Enter' && handleClick()}/>
                    <button className='btn btn-default' onClick={handleClick}>Load</button>
                </div>

                {/* BIBLE */}
                <AnchorBase anchor={baseAnchor} className="base">

                    {/*content /* autofill from JSON */}
                    <Scripture contents={passageContents}></Scripture>

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
        </>
    );
}

export default App;