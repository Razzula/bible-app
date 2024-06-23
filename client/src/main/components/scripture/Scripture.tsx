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
import IconButton from '../common/IconButton';
import CheckIcon from '../common/CheckIcon';
import RadioIcons from '../common/RadioIcons';

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

    const [selectedRenderMode, setSelectedRenderMode] = useState('sidenotes');
    const [showFootnotes, setShowFootnotes] = useState(true)
    const [showHeaders, setShowHeaders] = useState(true)
    const [showNumbers, setShowNumbers] = useState(true)
    const [showHighlights, setShowHighlights] = useState(true)

    const [historyStacks, setHistoryStacks]: [Array<Array<string>>, Function] = useState([[], []]);

    const [passages, setPassages]: [JSX.Element[], Function] = useState([]);

    const [noteGroupsList, setNoteGroupsList] = useState<any[]>([]);
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
        noteGroups.push({ path: 'None' });

        const noteGroupsList = noteGroups.map((noteGroup: any) => {
            return {
                key: noteGroup.path,
                name: noteGroup.path,
                element: <div className='select-option'>{noteGroup.path}</div>
            };
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
            loadPassageFromUSFM, createNewTab, setPassages, setSearchError, setSearchQuery, searchQuery, historyStacks, setHistoryStacks, selectedNoteGroup, selectedRenderMode,
            id
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
        '--label-display': showNumbers ? 'inline-block' : 'none',
        '--highlight-display': showHighlights ? null : 'transparent',
    };

    // GENERATE JSX
    return (
        <div className="scripture">

            {/* BANNER */}
            <div className="banner">

                <div className="input-group side">
                    {/* NOTE GROUP SELECT */}
                    <Tooltip>
                        <TooltipTrigger>
                            <Select
                                entries={noteGroupsList}
                                forcedIndex={noteGroupsList.findIndex((noteGroup) => noteGroup?.key === selectedNoteGroup)}
                                setSelected={setSelectedNoteGroup}
                                icon='directory'
                            />
                        </TooltipTrigger>
                        <TooltipContent>Note Group</TooltipContent>
                    </Tooltip>
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
                        <CheckIcon iconName='footnote' text={`${showFootnotes ? 'Hide' : 'Show'} Footnotes`} handleClick={() => setShowFootnotes(!showFootnotes)} stateDriver={showFootnotes} />
                        <CheckIcon iconName='header' text={`${showHeaders ? 'Hide' : 'Show'} Headings`} handleClick={() => setShowHeaders(!showHeaders)} stateDriver={showHeaders} />
                        <CheckIcon iconName='numbers' text={`${showNumbers ? 'Hide' : 'Show'} Verse Numbers`} handleClick={() => setShowNumbers(!showNumbers)} stateDriver={showNumbers} />
                        <CheckIcon iconName='highlighter' text={`${showHighlights ? 'Hide' : 'Show'} Note Highlights`} handleClick={() => setShowHighlights(!showHighlights)} stateDriver={selectedRenderMode == 'sidenotes' && showHighlights} />

                        &nbsp;&nbsp;&nbsp;&nbsp;

                        <RadioIcons selected={selectedRenderMode} handleClick={setSelectedRenderMode} states={[
                            {id: 'sidenotes', iconName: 'note', text: 'Sidenotes' },
                            {id: 'interlinear', iconName: 'inline', text: 'Inline Notes' },
                        ]} />

                    </div>
                </div>

                <div className="input-group side">
                    {/* NOTE GROUP SELECT */}
                    <Tooltip>
                        <TooltipTrigger>
                            <Select
                                entries={noteGroupsList}
                                forcedIndex={noteGroupsList.findIndex((noteGroup) => noteGroup?.key === selectedNoteGroup)}
                                setSelected={setSelectedNoteGroup}
                                icon='directory'
                            />
                        </TooltipTrigger>
                        <TooltipContent>Note Group</TooltipContent>
                    </Tooltip>
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
            <IconButton iconName='back' text='Backwards' handleClick={handleBackClick} disabled={historyStacks[0].length <= 1} />
            <IconButton iconName='forward' text='Forwards' handleClick={handleForwardClick} disabled={historyStacks[1].length < 1} />

            {/* SEARCH BAR */}
            <input type="text" value={searchQuery} className='form-control' onChange={handleSearchBarChange} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={searchStyle} />
            {/* TRANSLATION SELECT */}
            <Tooltip>
                <TooltipTrigger>
                    <Select
                        entries={translationsList}
                        forcedIndex={translationsList.findIndex((translation) => selectedTranslation && translation?.key === selectedTranslation?.key)}
                        setSelected={updateSelectedTranslation}
                        icon='translation'
                    />
                </TooltipTrigger>
                <TooltipContent>Translation</TooltipContent>
            </Tooltip>
            {/* SEARCH BUTTON */}
            <IconButton iconName='search' text='Search' handleClick={handleSearch} />
        </div>
    );

}

export default Scripture;
