import React, { useState, cloneElement, useEffect } from 'react';
import { Store, Sidenote, InlineAnchor, AnchorBase } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { useStore } from 'react-redux';
import { Alert } from 'react-bootstrap';

import { getUSFM, getReferenceText }  from '../../utils/bibleReferences';

import Passage from './Passage';

import licenses from '../../../../public/licenses.json';

declare global {
    interface Window {
        [index: string]: any;
    }
}

let store: Store;

const docId = 'article';
const baseAnchor = 'anchor';

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function Scripture() {
    const [searchQuery, setSearchQuery] = useState('');
    const [translationsList, setTranslationsList] = useState('');
    const [selectedTranslation, setSelectedTranslation] = useState('');
    const [selectedTranslationLicense, setSelectedTranslationLicense] = useState('');

    const [historyStacks, setHistoryStacks]: [Array<Array<string>>, Function] = useState([[],[]]);

    const [passages, setPassages]: [JSX.Element, Function] = useState(<></>);

    store = useStore();
    const deselect = () => store.dispatch(deselectSidenote(docId));

    useEffect(() => {
        getTranslationList();
    }, []);

    useEffect(() => {
        loadPassageFromString(searchQuery);
    }, [selectedTranslation]);
    
    function handleSearch() {
        void loadPassageFromString(searchQuery, true);
    }

    function handleBackClick() {
        if (historyStacks[0].length >= 2) {
            const currentSearchQuery = historyStacks[0].pop();
            const pastSearchQuery = historyStacks[0].pop();

            // load past page
            if (pastSearchQuery) {
                void loadPassageFromString(pastSearchQuery);
            }
            
            // allow returning to current page
            if (currentSearchQuery) {
                historyStacks[1].push(currentSearchQuery);
            }
            if (historyStacks) {
                setHistoryStacks(historyStacks);
            }
        }
    }

    function handleForwardClick() {
        if (historyStacks[1].length >= 1) {
            const pastSearchQuery = historyStacks[1].pop();
            
            if (pastSearchQuery) {
                void loadPassageFromString(pastSearchQuery);
            }
            if (historyStacks) {
                setHistoryStacks(historyStacks);
            }
        }
    }

    function handleSearchBarChange(event: React.ChangeEvent<any>) {
        setSearchQuery(event.currentTarget.value);
    }

    function handleTranslationSelectChange(event: React.ChangeEvent<any>) {
        updateSelectedTranslation(event.currentTarget.value);
    }

    function updateSelectedTranslation(translation: string) {
        setSelectedTranslation(translation);
        setSelectedTranslationLicense((licenses as any)[translation]);
    }

    function handleTextSelection() {
        const selectedElement = getSelectedElement() as HTMLElement;
    }

    function getSelectedElement() {
        const selection = window.getSelection();
        if (selection) {
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (range) {
                    const node = range.startContainer;

                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.parentElement;
                    } else {
                        return node;
                    }
                }
            }
        }
        return null;
    }

    async function getTranslationList() {
        const translations = await window.electronAPI.getDirectories(`Scripture`);

        if (translations.length === 0) {
            console.log('No translations found');
            setPassages(
                <Alert variant="danger">
                    <Alert.Heading>404</Alert.Heading>
                    <p>
                        No translations found. Please add a translation to the Scripture folder.
                    </p>
                </Alert>
            );
            return null;
        }

        const translationList = translations.map((translation: string) => {
            return <option key={translation} value={translation}>{translation}</option>;
        });

        setTranslationsList(translationList);
        updateSelectedTranslation('NKJV'); //TODO: make this a setting
    }

    function wrapSelectedElement(element: HTMLElement, wrapper: HTMLElement) { // TODO; wrapping a footnote breaks
        const range = window.getSelection()?.getRangeAt(0);
        if (!range) {
            return;
        }

        const selectedNodes = range.cloneContents().childNodes;
        if (!selectedNodes || !selectedNodes.length) {
            return;
        }

        const startNode = range.startContainer;
        const startOffset = range.startOffset;
        const endNode = range.endContainer;
        const endOffset = range.endOffset;

        const multiSpanning = (range.startContainer !== range.endContainer);

        // create new nodes for the three parts of the original element
        const beforeSelected = document.createTextNode(
            startNode.textContent?.substring(0, startOffset) ?? ""
        );
        const afterSelected = document.createTextNode(
            endNode.textContent?.substring(endOffset) ?? ""
        );
        
        // move the selected nodes to a new wrapper element
        const newWrapper = wrapper.cloneNode() as HTMLElement;
        while (selectedNodes.length) {
            newWrapper.appendChild(selectedNodes[0]);
        }

        // clear the selection
        range.deleteContents();
        element.innerHTML = "";

        // rebuild the original element with the three parts
        element.appendChild(beforeSelected);
        element.appendChild(newWrapper);
        if (!multiSpanning) {
            element.appendChild(afterSelected);
        }
        
        console.log(beforeSelected);
        console.log(newWrapper);
        console.log(afterSelected);

    }

    function generatePassage(chapterContents: any, i: number, chaptersContentsLength: number, passageBook: string, passageChapter: number) {
            console.log(chapterContents)
        if (chapterContents[0][0].chapter) { // there is a subsequent chapter
            return (
                <>
                <hr/>
                <Passage key={`${passageBook}.${passageChapter}.${i}`} contents={chapterContents} loadPassage={loadPassageFromUSFM} passageBook={passageBook} passageChapter={passageChapter} translation={selectedTranslation} />
                </>
            );
        }
        return (<Passage contents={chapterContents} loadPassage={loadPassageFromUSFM} passageBook={passageBook} passageChapter={0} translation={selectedTranslation} />);
    }

    function loadPassageFromString(searchQuery: string, clearForwardCache = false) {
        
        const result = getUSFM(searchQuery);
        if (!result) {
            return;
        }

        void loadPassageFromUSFM(result, clearForwardCache)
    }

    async function loadPassageFromUSFM(usfm: any, clearForwardCache = false) {
 
        const chaptersContents = [];
        
        if (Array.isArray(usfm)) { // TODO; TEMP
            
            usfm = usfm[0]; // TODO; actully load the contetns of all the passages
        }
        
        if (usfm === undefined || usfm === null) {
            return;
        }
        console.log(usfm)

        const chapterRange = usfm.finalChapter ? usfm.finalChapter : usfm.initialChapter;

        // load chapters from files
        for (let chapter = usfm.initialChapter; chapter <= chapterRange; chapter++) {
            const fileName = `${usfm.book}.${chapter}`;
            
            if (!fileName) { // invalid
                continue;
            }
            // TODO; prevent multiple reads of current file
            
            // load contents externally from files
            const chapterContents = await window.electronAPI.readFile(fileName,`Scripture/${selectedTranslation}`); // TODO; single-chapter books // TODO; make NKJV
            if (chapterContents) {
                chapterContents[0][0].chapter = chapter;
            }
            chaptersContents.push(chapterContents);

            deselect();
    
        }

        // TOOO; better way to do this
        const passageContents = chaptersContents.map((chapterContents: any, i: number) => generatePassage(chapterContents, i, chaptersContents.length, usfm.book, usfm.initialChapter));

        setPassages(
            <AnchorBase anchor={baseAnchor} className="base">
                {[passageContents]}
            </AnchorBase>
        );
        setSearchQuery(getReferenceText(usfm)); // format, e.g 'gen1' --> 'Genesis 1'
        
        // scroll to verse if specified
        if (usfm.initialVerse) { // might need to move into state
            
            const range = usfm.finalVerse ? usfm.finalVerse : usfm.initialVerse;
            
            // jump to passage
            const element = document.getElementById(`v${usfm.initialVerse-1}`); // TEMP; -1 prevents verse going all the way to top
            if (element) {
                element.scrollIntoView();
            }
            else {
                document.getElementById(docId)?.scrollIntoView(); // goto top
            }
            
            // highlight passage
            for (let verse = usfm.initialVerse; verse <= range; verse++) {
                
                const elements = document.getElementsByClassName(`${usfm.book}.${usfm.initialChapter}.${verse}`);
                for(const e of elements) {
                    const element = e as HTMLElement;
                    element.classList.remove('blink');
                    element.offsetWidth; // allow repetition
                    element.classList.add('blink');
                }
                
            }
            
        }
        else {
            document.getElementById(docId)?.scrollIntoView(); // goto top
        }
        
        // TODO; validation
        historyStacks[0].push(searchQuery)
        if (clearForwardCache) {
            historyStacks[1] = new Array<string>();
        }
        setHistoryStacks(historyStacks);
    }

    async function expandPassage(delta: number) {
        // get next chapter
        const historyStack = historyStacks[0]
        const usfm = getUSFM(historyStack[historyStack.length-1])[0]; // TODO; TEMP

        let extraChapter = usfm.finalChapter ? usfm.finalChapter : usfm.initialChapter
        extraChapter = Number(extraChapter) + delta

        const fileName = `${usfm.book}.${extraChapter}`
        const chapterContents = await window.electronAPI.readFile(fileName,`Scripture/${selectedTranslation}`);
        if (chapterContents) {
            chapterContents[0][0].chapter = extraChapter;
        }
        
        // truncate up to next heading
        let extraContents = [];

        const start = (delta === 1 ? 0 : chapterContents.length - 1)

        for (let i = start; (i < chapterContents.length && i >= 0); i += delta) {

            if (i !== 0) {
                if (chapterContents[i].header) {
                    if (delta === -1) {
                        extraContents.push(chapterContents[i]);
                    }
                    break;
                }
                if (chapterContents[i][0]?.header) {
                    if (delta === -1) {
                        extraContents.push(chapterContents[i]);
                    }
                    break;
                }
            }
            extraContents.push(chapterContents[i]);
            
        }

        //TODO; fix
        // generate passage and merge into current
        if (delta === 1) {
            const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter));
        }
        else { // TODO; fix verse numbers
            extraContents = extraContents.reverse()
            extraContents[0][0].verse = (chapterContents.length + 1) - extraContents.length;
            const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter));
        }
    }

    // GENERATE JSX
    return (
        <>

            {/* BANNER */}
            <div className="input-group">
                <button className='btn btn-default' onClick={handleBackClick} disabled={historyStacks[0].length <= 1}>←</button>
                <button className='btn btn-default' onClick={handleForwardClick} disabled={historyStacks[1].length < 1}>→</button>

                {/* SEARCH BAR */}
                <input type="text" value={searchQuery} className="form-control" onChange={handleSearchBarChange} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}/>
                {/* TRANSLATION SELECT */}
                <select value={selectedTranslation}className="select" onChange={handleTranslationSelectChange}>
                    {translationsList}
                </select>
                {/* SEARCH BUTTON */}
                <button className='btn btn-default' onClick={handleSearch} disabled={searchQuery.length === 0}>Load</button>
            </div>

            <div className='scroll'>
                <article id={docId} onClick={deselect} onMouseUp={handleTextSelection}>
                    
                        {/* BIBLE */}
                        {/* <button onClick={() => expandPassage(-1)} className='btn btn-default ellipsis'>...</button><br/> */}
                        {passages}
                        {/* <button onClick={() => expandPassage(1)} className='btn btn-default ellipsis'>...</button><br/> */}
                        {(passages.props.children?.length > 0) ? <p className="notice">{selectedTranslationLicense}</p> : null}

                        {/* SIDENOTES */} {/* TODO; generate dynamically */}
                        

                </article>
            </div>
        </>
    );
}

export default Scripture;