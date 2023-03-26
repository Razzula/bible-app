import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';

import Footnote from './Footnote';

import '../../styles/bible.scss';

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
                    <Footnote contents={item.content} loadPassage={loadPassage} />
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

export default Scripture;