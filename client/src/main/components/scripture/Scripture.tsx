import React, { ChangeEvent, useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { useStore } from 'react-redux';
import { Store } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';

import { setNoActiveEditor, setNoActiveToken } from '../../redux/actions';
import FileManager from '../../utils/FileManager';
import SettingsManager from '../../utils/SettingsManager';
import { getBookUSFM, getReferenceText, getUSFM } from '../../utils/bibleReferences';
import Passage from './Passage';
import { Tooltip, TooltipTrigger, TooltipContent } from '../common/Tooltip';

import licenses from '../../../../public/licenses.json';
import { WindowTypes } from '../../utils/enums';

import '../../styles/scripture.scss';
import '../../styles/common.scss'
import { isElectronApp } from '../../../main/utils/general';
import Select from '../common/Select';
import { loadPassageUsingString, loadPassageUsingUSFM, loadTranslationList } from '../../../main/utils/ScriptureHelper';

declare global {
    interface Window {
        [index: string]: any;
    }
}

type ScriptureProps = {
    id: string,
    queryToLoad?: string;
    createNewTab: (panelType: any, data: string) => void;
};

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function Scripture({ id, queryToLoad, createNewTab }: ScriptureProps): JSX.Element {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchError, setSearchError] = useState(false);
    const [translationsList, setTranslationsList] = useState<any[]>([]);
    const [selectedTranslation, setSelectedTranslation] = useState<any>(null);
    const [showFootnotes, setShowFootnotes] = useState(true)
    const [selectedRenderMode, setSelectedRenderMode] = useState('sidenotes');
    const [showHeaders, setShowHeaders] = useState(true)

    const [historyStacks, setHistoryStacks]: [Array<Array<string>>, Function] = useState([[], []]);

    const [passages, setPassages]: [JSX.Element[], Function] = useState([]);

    const [noteGroupsList, setNoteGroupsList] = useState<React.JSX.Element[]>([]);
    const [selectedNoteGroup, setSelectedNoteGroup] = useState<string | undefined>(undefined);

    const fileManager = FileManager.getInstance();
    const settings = SettingsManager.getInstance();

    const store: Store = useStore();
    const deselect = () => {
        store.dispatch(deselectSidenote(id));
        if (document.activeElement?.className !== 'editor-input') { // allow clicking on inline notes
            store.dispatch(setNoActiveEditor());
        }
        store.dispatch(setNoActiveToken());
    };

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
        if (searchQuery !== '') {
            if (selectedTranslation !== null && selectedNoteGroup !== null) {
                loadPassageFromString(searchQuery);
            }
        }
        else if (queryToLoad !== undefined && selectedTranslation !== null && selectedNoteGroup !== '') {
            loadPassageFromString(queryToLoad);
        }
    }, [selectedTranslation, selectedNoteGroup, selectedRenderMode]);

    function handleSearch(): void {
        if (searchQuery !== '') {
            void loadPassageFromString(searchQuery, true);
        }
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

    function updateSelectedTranslation(translation: string): void {
        setSelectedTranslation(translationsList.find((t) => t.name === translation) ?? null);
    }

    async function getTranslationList(): Promise<void> {
        const translations = await fileManager.getDirectories('Scripture');

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

        loadTranslationList(setTranslationsList, setSelectedTranslation);
    }

    async function getNoteGroupsList(): Promise<void> {
        const noteGroups = await fileManager.getDirectories('notes');

        const noteGroupsList = noteGroups.map((noteGroup: any) => {
            return <option key={noteGroup.path} value={noteGroup.path}>{noteGroup.path}</option>;
        });

        setNoteGroupsList(noteGroupsList);
        setSelectedNoteGroup(noteGroupsList.length > 0 ? noteGroupsList[0].key ?? undefined : undefined);
    }

    function loadPassageFromString(searchQuery: string, clearForwardCache = false): void {
        loadPassageUsingString(searchQuery, selectedTranslation, loadPassageFromUSFM, setSearchError, clearForwardCache);
    }

    async function loadPassageFromUSFM(usfm: any, clearForwardCache = false, openInNewTab = false): Promise<void> {

        loadPassageUsingUSFM(
            usfm, selectedTranslation, clearForwardCache, openInNewTab, Passage, false,
            loadPassageFromUSFM, createNewTab, setPassages, setSearchError, setSearchQuery, searchQuery, historyStacks, setHistoryStacks, selectedNoteGroup, selectedRenderMode
        );

        deselect();
    }

    function handleNoteGroupSelectChange(event: ChangeEvent<any>): void {
        setSelectedNoteGroup(event.currentTarget.value);
    }

    // CSS
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
                    <img src='/bible-app/icons/directory.svg' alt='Note Groups'/>
                    <select value={selectedNoteGroup} className="select" onChange={handleNoteGroupSelectChange} disabled={true}>
                        {noteGroupsList}
                        <option key='None' value={undefined}>None</option>
                    </select>
                </div>

                <div>
                    {/* MAIN CONTROLS */}
                    <ScriptureSearchHeader
                        handleBackClick={handleBackClick} handleForwardClick={handleForwardClick} historyStacks={historyStacks}
                        searchQuery={searchQuery} handleSearchBarChange={handleSearchBarChange} handleSearch={handleSearch}
                        translationsList={translationsList} selectedTranslation={selectedTranslation} updateSelectedTranslation={updateSelectedTranslation}
                        searchError={searchError}
                    />

                    {/* SUB CONTROLS */}
                    <div>
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
                    <img src='/bible-app/icons/directory.svg' alt='Note Groups'/>
                    <select value={selectedNoteGroup} className="select" onChange={handleNoteGroupSelectChange}>
                        {noteGroupsList}
                        <option key='None' value={undefined}>None</option>
                    </select>
                </div>
            </div>

            <div className='scroll' style={containerStyle as any}>
                <article id={id} onClick={deselect}>

                    {/* BIBLE */}
                    {passages}
                    {(passages.length > 0) ? <p className="notice">{selectedTranslation?.license === 'PUBLIC_DOMAIN' ? licenses.PUBLIC_DOMAIN : selectedTranslation?.license}</p> : null}

                </article>
            </div>

        </div>
    );
}

export type ScriptureSearchHeaderProps = {
    handleBackClick: () => void;
    handleForwardClick: () => void;
    historyStacks: Array<Array<string>>;
    searchQuery: string;
    handleSearchBarChange: (event: ChangeEvent<any>) => void;
    handleSearch: () => void;
    translationsList: any[];
    selectedTranslation: any;
    updateSelectedTranslation: (translation: string) => void;
    searchError: boolean;
}

export function ScriptureSearchHeader({handleBackClick, handleForwardClick, historyStacks, searchQuery, handleSearchBarChange, handleSearch, translationsList, selectedTranslation, updateSelectedTranslation, searchError}: ScriptureSearchHeaderProps): JSX.Element {

        const searchStyle: any = {
        'backgroundColor': searchError ? 'var(--error-background-color)' : 'var(--select-background-color-default)'
    };

    return (
        <div className="input-group main">
            <button className='btn btn-default' onClick={handleBackClick} disabled={historyStacks[0].length <= 1}>←</button>
            <button className='btn btn-default' onClick={handleForwardClick} disabled={historyStacks[1].length < 1}>→</button>

            {/* SEARCH BAR */}
            <input type="text" value={searchQuery} className="form-control" onChange={handleSearchBarChange} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={searchStyle} />
            {/* TRANSLATION SELECT */}
            <Select
                entries={translationsList}
                forcedIndex={translationsList.findIndex((translation) => selectedTranslation && translation?.key === selectedTranslation?.key)}
                setSelected={updateSelectedTranslation}
            />
            {/* SEARCH BUTTON */}
            <button className='btn btn-default' onClick={handleSearch} disabled={searchQuery?.length === 0}>
                <img src='/bible-app/icons/search.svg' alt='Search'/>
            </button>
        </div>
    );

}

export default Scripture;