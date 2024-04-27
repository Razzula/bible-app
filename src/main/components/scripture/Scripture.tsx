import React, { useState, useEffect, ChangeEvent } from 'react';
import { Store, AnchorBase } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { useStore } from 'react-redux';
import { Alert } from 'react-bootstrap';

import FileManager from '../../utils/FileManager';
import { getUSFM, getReferenceText } from '../../utils/bibleReferences';

import Passage from './Passage';

import licenses from '../../../../public/licenses.json';
import { WindowTypes } from '../../utils/enums';

declare global {
    interface Window {
        [index: string]: any;
    }
}

let store: Store;

const docID = 'article';

type ScriptureProps = {
    queryToLoad?: string;
    createNewTab: (panelType: symbol, data: string) => void;
}

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function Scripture({ queryToLoad, createNewTab }: ScriptureProps): JSX.Element {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchError, setSearchError] = useState(false);
    const [translationsList, setTranslationsList] = useState('');
    const [selectedTranslation, setSelectedTranslation] = useState('');
    const [selectedTranslationLicense, setSelectedTranslationLicense] = useState('');
    const [showFootnotes, setShowFootnotes] = useState(true)
    const [selectedRenderMode, setSelectedRenderMode] = useState('sidenotes');
    const [showHeaders, setShowHeaders] = useState(true)

    const [historyStacks, setHistoryStacks]: [Array<Array<string>>, Function] = useState([[], []]);

    const [passages, setPassages]: [JSX.Element[], Function] = useState([]);

    const [noteGroupsList, setNoteGroupsList] = useState('');
    const [selectedNoteGroup, setSelectedNoteGroup] = useState('');

    const fileManager = FileManager.getInstance();

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
            setPassages([
                <Alert variant="danger">
                    <Alert.Heading>404</Alert.Heading>
                    <p>
                        No translations found. Please add a translation to the Scripture folder.
                    </p>
                </Alert>
            ]);
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

    function loadPassageFromString(searchQuery: string, clearForwardCache = false): void {
        // debugger;
        if (searchQuery === undefined || searchQuery === null || searchQuery === '') {
            return;
        }
        if (selectedTranslation === undefined || selectedTranslation === null || selectedTranslation === '') {
            return;
        }

        const result = getUSFM(searchQuery);
        if (result.length === 0) {
            setSearchError(true);
            return;
        }

        void loadPassageFromUSFM(result, clearForwardCache)
    }

    async function loadPassageFromUSFM(usfm: any, clearForwardCache = false, openInNewTab = false): Promise<void> {

        if (openInNewTab) {
            createNewTab(WindowTypes.Scripture.Type, getReferenceText(usfm));
            return;
        }

        if (!Array.isArray(usfm)) {
            usfm = [usfm];
        }

        const passages: JSX.Element[] = await Promise.all(
            usfm.map(async (passageUsfm: any) => {

                if (passageUsfm === undefined || passageUsfm === null) {
                    return;
                }

                const chaptersContents: any[] = [];
                const chapterRange = passageUsfm.finalChapter ? passageUsfm.finalChapter : passageUsfm.initialChapter;

                // load chapters from files
                for (let chapter = passageUsfm.initialChapter; chapter <= chapterRange; chapter++) {

                    if (!passageUsfm.book) { // invalid
                        continue;
                    }
                    // TODO; prevent multiple reads of current file

                    // load contents externally from files
                    const chapterContents = await fileManager.loadScripture(passageUsfm.book, chapter, selectedTranslation); // TODO; single-chapter books
                    if (chapterContents) {
                        chaptersContents.push(chapterContents);
                    }

                }

                if (chaptersContents.length === 0) {
                    return;
                }

                const usfmString = getReferenceText(passageUsfm);
                return <Passage
                    key={usfmString} contents={chaptersContents} usfm={passageUsfm} translation={selectedTranslation} loadPassage={loadPassageFromUSFM} docID={docID} selectedNoteGroup={selectedNoteGroup} renderMode={selectedRenderMode}
                />;
            })
        );

        deselect();

        // display passages
        if (passages) {
            setPassages(passages);
            setSearchError(false);
            setSearchQuery(getReferenceText(usfm)); // format, e.g 'gen1' --> 'Genesis 1'

            // TODO; validation
            historyStacks[0].push(searchQuery)
            if (clearForwardCache) {
                historyStacks[1] = new Array<string>();
            }
            setHistoryStacks(historyStacks);
        }
        else {
            setSearchError(true);
        }

        setTimeout(() => { // TODO: make this in response

            // scroll to verse if specified
            if (Array.isArray(usfm)) { // only scroll to first passage
                usfm = usfm[0];
            }
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
        }, 100);

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
                </div>
            </div>

            <div className='scroll' style={containerStyle as any}>
                <article id={docID} onClick={deselect}>

                    {/* BIBLE */}
                    {passages}
                    {(passages.length > 0) ? <p className="notice">{selectedTranslationLicense}</p> : null}

                </article>
            </div>

        </div>
    );
}

export default Scripture;