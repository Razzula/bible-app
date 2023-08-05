import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';

import Footnote from './Footnote';

import '../../styles/bible.scss';

type Scripture = {
    contents: any;
    ignoreFootnotes?: boolean;
    loadPassage?: any;
    passageBook?: string;
    passageChapter?: number;
}

/**
 * A React component to display scripture.
 * 
 * @param {ScriptureProps} props - The properties passed to the component.
 *   - contents (any): The contents of the scripture.
 *   - ignoreFootnotes (boolean): Whether to ignore footnotes.
 *   - loadPassage (Function): A function to load a passage.
 *   - passageBook (string): The current book.
 *   - passageChapter (number): The current chapter.
 * 
 * @returns {JSX.Element} A JSX Element of a `span` containing the scripture.
 */
function Scripture({ contents, ignoreFootnotes, loadPassage, passageBook, passageChapter }: Scripture) {

    // presence check
    if (contents === null) {
        return (
            <Alert variant="danger">
                <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
                <p>
                    Change this and that and try again.
                </p>
            </Alert>
        );
    }

    // DYNAMICALLY GENERATE BIBLE CONTENTS
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
            
            section.test = ` v${verse+i}`; // TODO; rename 'verse'->'initialVerse', 'test'->'verse'
            temp.push(section);
        };
    }
    paragraphs.push(temp);

    // format paragraphs
    function generateContents(item: any) {
        // footnotes
        if (item.type === 'note') {
            if (ignoreFootnotes) {
                return;
            }

            console.log(item);
            return (
                <Footnote contents={item.content} loadPassage={loadPassage} currentBook={passageBook ?? ''} currentChapter={passageChapter ?? 0} />
            );
        }

        // labels
        if (item.type === 'label') {
            return (
                <span className={item.type} id={`v${item.content}`}>{item.content}</span> // can use scrollIntoView() to jump to verse
            );
        }
        if (item.type === 'label chapter') {
            return (
                <span className={item.type} id={'v1'}>{item.content}</span> // can use scrollIntoView() to jump to verse
            );
        }

        // other formatting
        console.log(item);
        if (item.children) { // if node is a parent, recursively generate its contents
            return (
                <span className={`${item.type} ${item.test}`}>{item.children.map(generateContents)}</span>
            );
        }
        return (
            <span className={`${item.type} ${item.test}`}>{item.content}</span>
        );
    }

    const content = paragraphs.map((paragraph: Array<{type:string, content:string, test:string}>) => {

        // format contents of paragraph
        const paraContent = paragraph.map(generateContents);

        let paraType = paragraph[0].type
        if (paraType.startsWith('label')) {
            paraType = paragraph[1].type
        }

        return (
            <>
                <span className={paraType}>
                    {paraContent}
                </span>
                <br/>
            </>
        );
    });

    // TODO; work out how to use <InLineAnchor>s with this new system
    
    return (<>{content}</>);
}

export default Scripture;