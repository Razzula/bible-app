import React, { ChangeEvent, useEffect, useState } from 'react';

import { ScriptureSearchHeader } from './scripture/Scripture';
import FileManager from '../utils/FileManager';
import { loadPassageUsingString, loadPassageUsingUSFM, loadTranslationList } from '../utils/ScriptureHelper';

import '../styles/scripture.scss';
import '../styles/common.scss'
import { WindowTypes } from '../utils/enums';
import { getReferenceText } from '../utils/bibleReferences';
import { PassageProps } from './scripture/Passage';

import licenses from '../../../public/licenses.json';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip';

type InterlinearProps = {
    queryToLoad?: string;
    createNewTab: (panelType: any, data: string) => void;
};

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function Interlinear({ queryToLoad, createNewTab }: InterlinearProps): JSX.Element {

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchError, setSearchError] = useState(false);
    const [translationsList, setTranslationsList] = useState<any[]>([]);
    const [selectedTranslation, setSelectedTranslation] = useState<any>(null);
    const [historyStacks, setHistoryStacks]: [Array<Array<string>>, Function] = useState([[], []]);

    const [passages, setPassages]: [JSX.Element[], Function] = useState([]);

    const fileManager = FileManager.getInstance();

    useEffect(() => {
        getTranslationList();
    }, []);

    useEffect(() => {
        if (queryToLoad !== undefined) {
            setSearchQuery(queryToLoad);
            loadPassageFromString(queryToLoad);
        }
    }, [queryToLoad]);

    useEffect(() => {
        if (searchQuery !== '') {
            if (selectedTranslation !== null) {
                loadPassageFromString(searchQuery);
            }
        }
    }, [selectedTranslation]);

    async function getTranslationList(): Promise<void> {
        const translations = await fileManager.getDirectories('Scripture');

        if (translations.length === 0) {
            // setPassages([
            //     <Alert variant="danger">
            //         <Alert.Heading>404</Alert.Heading>
            //         <p>
            //             No translations found. Please add a translation to the Scripture folder.
            //         </p>
            //     </Alert>
            // ]);
            return;
        }

        loadTranslationList(setTranslationsList, setSelectedTranslation, 'interlinear');
        setSelectedTranslation(translationsList.find((t) => t.name === 'Interlinear'));
    }

    function loadPassageFromString(searchQuery: string, clearForwardCache = false): void {
        loadPassageUsingString(searchQuery, selectedTranslation, loadPassageFromUSFM, setSearchError, clearForwardCache);
    }

    async function loadPassageFromUSFM(usfm: any, clearForwardCache = false, openInNewTab = false): Promise<void> {
        loadPassageUsingUSFM(
            usfm, selectedTranslation, clearForwardCache, openInNewTab, InterlinearPassage, true,
            loadPassageFromUSFM, createNewTab, setPassages, setSearchError, setSearchQuery, searchQuery, historyStacks, setHistoryStacks, undefined, 'interlinear'
        );
    }

    function updateSelectedTranslation(translation: string): void {
        setSelectedTranslation(translationsList.find((t) => t.name === translation) ?? null);
    }

    function handleSearchBarChange(event: ChangeEvent<any>): void {
        setSearchQuery(event.currentTarget.value);
        setSearchError(false);
    }

    function handleSearch(): void {
        if (searchQuery !== '') {
            void loadPassageFromString(searchQuery, true);
        }
    }

    function handleBackClick(): void {
    }

    function handleForwardClick(): void {
    }

    return (
        <div className='scripture-interlinear'>

            {/* BANNER */}
            <div className='banner'>

                <div className='container'>
                    {/* MAIN CONTROLS */}
                    <ScriptureSearchHeader
                        handleBackClick={handleBackClick} handleForwardClick={handleForwardClick} historyStacks={historyStacks}
                        searchQuery={searchQuery} handleSearchBarChange={handleSearchBarChange} handleSearch={handleSearch}
                        translationsList={translationsList} selectedTranslation={selectedTranslation} updateSelectedTranslation={updateSelectedTranslation}
                        searchError={searchError}
                    />
                </div>

            </div>

            <div className='scroll'>
                <div className='interlinear-contents'>
                    {/* BIBLE */}
                    {passages}
                    {(passages.length > 0) ? <p className="notice">{selectedTranslation?.license === 'PUBLIC_DOMAIN' ? licenses.PUBLIC_DOMAIN : selectedTranslation?.license}</p> : null}
                </div>
            </div>

        </div>
    );
}

export default Interlinear;

export function InterlinearPassage({ contents, usfm }: PassageProps): JSX.Element {

    const [formattedContent, setFormattedContent] = useState<JSX.Element[]>([]);

    useEffect(() => {
        const formattedContent: JSX.Element[] = [];

        for (const content of contents) {
            formattedContent.push(<div className='label chapter'>{usfm.initialChapter}</div>);
            Object.entries(content).forEach(([verseNumber, verse]: any) => {
                formattedContent.push(<div className='label'>{verseNumber}</div>);

                Object.entries(verse).forEach(([wordNumber, word]: any) => {
                    formattedContent.push(
                        <Tooltip>
                            <TooltipTrigger>
                                <div className='stack'>
                                            <span>
                                                {(word as any).native}
                                            </span>
                                    <span className='translit'>{(word as any).transliteration}</span>
                                    <span className='english'>{(word as any).eng}</span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>{(word as any).strongs?.data}</TooltipContent>
                        </Tooltip>
                    );
                });
            });
        }

        setFormattedContent(formattedContent);
    }, [contents]);


    return (
        <div className='base'>
            {contents.map((content: any, index: number) => (
                <div key={index} className='interlinear hebrew'>
                    {formattedContent}
                </div>
            ))}
        </div>
    );
}
