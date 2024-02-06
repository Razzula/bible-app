import React, { useState, useEffect, ChangeEvent } from 'react';
import { Store, AnchorBase } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { useStore } from 'react-redux';
import { Alert } from 'react-bootstrap';

import { getUSFM, getReferenceText } from '../../utils/bibleReferences';

import Passage from './Passage';

import licenses from '../../../../public/licenses.json';

declare global {
    interface Window {
        [index: string]: any;
    }
}

let store: Store;

const docID = 'article';
const baseAnchor = 'anchor';

type ScriptureProps = {
    queryToLoad?: string;
}

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function Scripture({ queryToLoad }: ScriptureProps): JSX.Element {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchError, setSearchError] = useState(false);
    const [translationsList, setTranslationsList] = useState('');
    const [selectedTranslation, setSelectedTranslation] = useState('');
    const [selectedTranslationLicense, setSelectedTranslationLicense] = useState('');
    const [showFootnotes, setShowFootnotes] = useState(true)
    const [selectedRenderMode, setSelectedRenderMode] = useState('sidenotes');
    const [showHeaders, setShowHeaders] = useState(true)

    const [historyStacks, setHistoryStacks]: [Array<Array<string>>, Function] = useState([[], []]);

    // const [passagesContents, setPassagesContents]: [any[], Function] = useState([]);
    const [passages, setPassages]: [JSX.Element, Function] = useState(<></>);

    const [noteGroupsList, setNoteGroupsList] = useState('');
    const [selectedNoteGroup, setSelectedNoteGroup] = useState('');

    store = useStore();
    const deselect = () => store.dispatch(deselectSidenote(docID));

    useEffect(() => {
        void getTranslationList();
        void getNoteGroupsList();
    }, []);

    // useEffect(() => {
    //     generatePassage(passagesContents,);
    // }, [passagesContents]);

    useEffect(() => {
        if (queryToLoad !== undefined) {
            setSearchQuery(queryToLoad);
            loadPassageFromString(queryToLoad);
        }
    }, [queryToLoad]);

    useEffect(() => {
        if (queryToLoad !== undefined && selectedTranslation !== '' && selectedNoteGroup !== '') {
            loadPassageFromString(searchQuery);
        }
    }, [selectedTranslation, selectedNoteGroup, selectedRenderMode]); //TODO: this is horribly ineffecient. we should cache the contents, usfm, etc. and reuse them

    function handleSearch(): void {
        void loadPassageFromString(searchQuery, true);
    }

    function handleBackClick(): void {
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

    function handleForwardClick(): void {
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

    function handleSearchBarChange(event: ChangeEvent<any>): void {
        setSearchQuery(event.currentTarget.value);
        setSearchError(false);
    }

    function handleTranslationSelectChange(event: ChangeEvent<any>): void {
        updateSelectedTranslation(event.currentTarget.value);
    }

    function updateSelectedTranslation(translation: string): void {
        setSelectedTranslation(translation);
        setSelectedTranslationLicense((licenses as any)[translation]);
    }

    async function getTranslationList(): Promise<void> {
        const translations = await window.electronAPI.getDirectories('Scripture');

        if (translations.length === 0) {
            setPassages(
                <Alert variant="danger">
                    <Alert.Heading>404</Alert.Heading>
                    <p>
                        No translations found. Please add a translation to the Scripture folder.
                    </p>
                </Alert>
            );
            return;
        }

        const translationList = translations.map((translation: string) => {
            return <option key={translation} value={translation}>{translation}</option>;
        });

        setTranslationsList(translationList);
        updateSelectedTranslation('NKJV'); //TODO: make this a setting
    }

    async function getNoteGroupsList(): Promise<void> {
        const noteGroups = await window.electronAPI.getDirectories('notes');

        const noteGroupsList = noteGroups.map((noteGroupName: string) => {
            return <option key={noteGroupName} value={noteGroupName}>{noteGroupName}</option>;
        });

        setNoteGroupsList(noteGroupsList);
        setSelectedNoteGroup(noteGroupsList.length > 0 ? noteGroupsList[0].key : ''); // TODO: make this a setting
    }

    function generatePassage(chapterContents: any, i: number, chaptersContentsLength: number, passageBook: string, passageChapter: number): JSX.Element {
        if (chapterContents[0][0].chapter) { // there is a subsequent chapter
            return (
                <>
                    <hr />
                    <Passage key={`${passageBook}.${passageChapter}.${i}`} contents={chapterContents} loadPassage={loadPassageFromUSFM} passageBook={passageBook} passageChapter={passageChapter} translation={selectedTranslation} selectedNoteGroup={selectedNoteGroup} docID={docID} renderMode={selectedRenderMode} />
                </>
            );
        }
        return (<Passage contents={chapterContents} loadPassage={loadPassageFromUSFM} passageBook={passageBook} passageChapter={0} translation={selectedTranslation} selectedNoteGroup={selectedNoteGroup} docID={docID} renderMode={selectedRenderMode} />);
    }

    function loadPassageFromString(searchQuery: string, clearForwardCache = false): void {

        if (searchQuery === undefined || searchQuery === null || searchQuery === '') {
            return;
        }

        const result = getUSFM(searchQuery);
        if (result.length === 0) {
            setSearchError(true);
            return;
        }

        void loadPassageFromUSFM(result, clearForwardCache)
    }

    async function loadPassageFromUSFM(usfm: any, clearForwardCache = false): Promise<void> {

        const chaptersContents = [];

        if (Array.isArray(usfm)) { // TODO; TEMP
            usfm = usfm[0]; // TODO; actully load the contetns of all the passages
        }

        if (usfm === undefined || usfm === null) {
            setSearchError(true);
            return;
        }
        
        const chapterRange = usfm.finalChapter ? usfm.finalChapter : usfm.initialChapter;
        
        // load chapters from files
        for (let chapter = usfm.initialChapter; chapter <= chapterRange; chapter++) {
            const fileName = `${usfm.book}.${chapter}`;
            
            if (!fileName) { // invalid
                continue;
            }
            // TODO; prevent multiple reads of current file
            
            // load contents externally from files
            const chapterContents = await window.electronAPI.loadScripture(fileName, selectedTranslation); // TODO; single-chapter books
            if (chapterContents) { //TODO temp?
                chapterContents[0][0].chapter = chapter;
            }
            if (chapterContents) {
                chaptersContents.push(chapterContents);
            }
            
        }
        
        if (chaptersContents.length === 0) {
            setSearchError(true);
            return;
        }
        setSearchError(false);
        
        deselect();
        // setPassagesContents(chaptersContents);

        // TOOO; better way to do this
        const passageContents = chaptersContents.map((chapterContents: any, i: number) => generatePassage(chapterContents, i, chaptersContents.length, usfm.book, usfm.initialChapter));

        setPassages(
            <>
                {[passageContents]}
            </>
        );
        setSearchQuery(getReferenceText(usfm)); // format, e.g 'gen1' --> 'Genesis 1'

        // scroll to verse if specified
        if (usfm.initialVerse) { // might need to move into state

            const range = usfm.finalVerse ? usfm.finalVerse : usfm.initialVerse;

            // jump to passage
            const element = document.getElementById(`v${usfm.initialVerse - 1}`); // TEMP; -1 prevents verse going all the way to top
            if (element) {
                element.scrollIntoView();
            }
            else {
                document.getElementById(docID)?.scrollIntoView(); // goto top
            }

            // highlight passage
            for (let verse = usfm.initialVerse; verse <= range; verse++) {

                const elements = document.getElementsByClassName(`${usfm.book}.${usfm.initialChapter}.${verse}`);
                for (const e of elements) {
                    const element = e as HTMLElement;
                    element.classList.remove('blink');
                    element.offsetWidth; // allow repetition
                    element.classList.add('blink');
                }

            }

        }
        else {
            document.getElementById(docID)?.scrollIntoView(); // goto top
        }

        // TODO; validation
        historyStacks[0].push(searchQuery)
        if (clearForwardCache) {
            historyStacks[1] = new Array<string>();
        }
        setHistoryStacks(historyStacks);
    }

    async function expandPassage(delta: number): Promise<void> {
        // get next chapter
        const historyStack = historyStacks[0]
        const usfm = getUSFM(historyStack[historyStack.length - 1])[0]; // TODO; TEMP

        let extraChapter = usfm.finalChapter ? usfm.finalChapter : usfm.initialChapter
        extraChapter = Number(extraChapter) + delta

        const fileName = `${usfm.book}.${extraChapter}`
        const chapterContents = await window.electronAPI.loadScripture(fileName, selectedTranslation);
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
            const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter + 1)); //TODO; we cannot always assume this will be initialChapter+1

            setPassages(<>{passages}{extraPassageContents}</>);
        }
        else { // TODO; fix verse numbers
            extraContents = extraContents.reverse()
            extraContents[0][0].verse = (chapterContents.length + 1) - extraContents.length;
            const extraPassageContents = [extraContents].map((chapterContents: [][], i: number) => generatePassage(chapterContents, i, 1, usfm.book, usfm.initialChapter - 1));

            setPassages(<>{extraPassageContents}{passages}</>);
        }
    }

    function handleNoteGroupSelectChange(event: ChangeEvent<any>): void {
        setSelectedNoteGroup(event.currentTarget.value);
    }

    // CSS
    const searchStyle: any = {
        'background-color': searchError ? 'var(--error-background-color)' : 'var(--select-background-color-default)'
    };

    const containerStyle: any = {
        '--note-display': showFootnotes ? 'inline' : 'none',
        '--header-display': showHeaders ? 'inline-block' : 'none',
    };

    // GENERATE JSX
    return (
        <div className="scripture">

            {/* BANNER */}
            <div className="banner">
                <div className="input-group side">
                    {/* NOTE GROUP SELECT */}
                    <select value={selectedNoteGroup} className="select" onChange={handleNoteGroupSelectChange}>
                        {noteGroupsList}
                    </select>
                    {/* NEW NOTE BUTTON */}
                    <button disabled className='btn btn-default'>New Note</button>
                </div>

                <div>
                    {/* MAIN CONTROLS */}
                    <div className="input-group main">
                        <button className='btn btn-default' onClick={handleBackClick} disabled={historyStacks[0].length <= 1}>←</button>
                        <button className='btn btn-default' onClick={handleForwardClick} disabled={historyStacks[1].length < 1}>→</button>

                        {/* SEARCH BAR */}
                        <input type="text" value={searchQuery} className="form-control" onChange={handleSearchBarChange} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={searchStyle} />
                        {/* TRANSLATION SELECT */}
                        <select value={selectedTranslation} className="select" onChange={handleTranslationSelectChange}>
                            {translationsList}
                        </select>
                        {/* SEARCH BUTTON */}
                        <button className='btn btn-default' onClick={handleSearch} disabled={searchQuery.length === 0}>Load</button>
                    </div>

                    {/* SUB CONTROLS */}
                    <div className="">
                        <label>
                            <input type='checkbox' className='' onChange={(e) => setShowFootnotes(e.currentTarget.checked)} defaultChecked={showFootnotes} />
                            Show Footnotes
                        </label>

                        <div className='btn-group' data-toggle='buttons'>
                            <label className='btn btn-primary'>
                                <input type='radio' name='options' id='sidenotes' value='sidenotes' checked={selectedRenderMode === 'sidenotes'} onChange={(e) => setSelectedRenderMode(e.target.value)} /> Annotations
                            </label>
                            <label className='btn btn-primary'>
                                <input type='radio' name='options' id='interlinear' value='interlinear' checked={selectedRenderMode === 'interlinear'} onChange={(e) => setSelectedRenderMode(e.target.value)} /> Interlinear
                            </label>
                        </div>

                        <label>
                            <input type='checkbox' className='' onChange={(e) => setShowHeaders(e.currentTarget.checked)} defaultChecked={showFootnotes} />
                            Show Headers
                        </label>

                    </div>
                </div>

                <div className="input-group side">
                    {/* NOTE GROUP SELECT */}
                    <select value={selectedNoteGroup} className="select" onChange={handleNoteGroupSelectChange}>
                        {noteGroupsList}
                    </select>
                    {/* NEW NOTE BUTTON */}
                    <button disabled className='btn btn-default'>New Note</button>
                </div>
            </div>

            <div className='scroll' style={containerStyle as any}>
                <article id={docID} onClick={deselect}>

                    {/* BIBLE */}
                    <AnchorBase anchor={baseAnchor} className="base">
                        <button onClick={() => expandPassage(-1)} hidden={historyStacks[0].length === 0} className='btn btn-default ellipsis'>...</button><br/>
                        {passages}
                        <button onClick={() => expandPassage(1)} hidden={historyStacks[0].length === 0} className='btn btn-default ellipsis'>...</button>
                    </AnchorBase>
                    {(passages.props.children?.length > 0) ? <p className="notice">{selectedTranslationLicense}</p> : null}

                </article>
            </div>

        </div>
    );
}

export default Scripture;