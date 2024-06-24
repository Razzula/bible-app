import React, { ChangeEvent, forwardRef, useEffect, useState } from 'react';

import { ScriptureSearchHeader } from './scripture/Scripture';
import FileManager from '../utils/FileManager';
import { loadPassageUsingString, loadPassageUsingUSFM, loadTranslationList } from '../utils/ScriptureHelper';

import '../styles/scripture.scss';
import '../styles/common.scss'
import { WindowTypes } from '../utils/enums';
import { getReferenceText, getUSFM } from '../utils/bibleReferences';
import { PassageProps } from './scripture/Passage';

import licenses from '../../../public/licenses.json';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip';
import { useSelector, useStore } from 'react-redux';
import { RootState } from '../redux/rootReducer';
import { Store } from 'redux';
import { selectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { setActiveToken, setNoActiveToken } from '../redux/actions';
import { BibleReference } from './scripture/Footnote';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import SettingsManager from '../utils/SettingsManager';
import { locateStrongsReferences } from '../utils/strongsReferences';

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
    const selectedToken = useSelector((state: RootState) => state.passage.activeToken);

    const [infoPanel, setInfoPanel] = useState<JSX.Element | null>(null);

    const [currentBook, setCurrentBook] = useState<string>('');

    const fileManager = FileManager.getInstance();
    const settings = SettingsManager.getInstance();

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

    useEffect(() => {
        if (selectedToken) {
            setInfoPanel(
                <ConcordancePanel
                    strongsNumber={selectedToken}
                    createNewTab={createNewTab}
                    currentBook={currentBook}
                    translation={settings.getSetting('defaultTranslation')}
                />
            );
        }
    }, [selectedToken]);

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
            loadPassageFromUSFM, createNewTab, setPassages, setSearchError, setSearchQuery, searchQuery, historyStacks, setHistoryStacks, undefined, 'interlinear',
            'base'
        );
        setCurrentBook(usfm[0].book);
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

            <div className='flex'>
                <div className='scroll'>
                    <div className='interlinear-contents'>
                        {/* BIBLE */}
                        {passages}
                        {(passages.length > 0) ? <p className="notice">{selectedTranslation?.license === 'PUBLIC_DOMAIN' ? licenses.PUBLIC_DOMAIN : selectedTranslation?.license}</p> : null}
                    </div>
                </div>

                { selectedToken ?
                    <div className='scroll'>
                        {/* <div className='infoPanel'> */}
                            {infoPanel}
                        {/* </div> */}
                    </div> : null
                }
            </div>

        </div>
    );
}

export default Interlinear;

export function InterlinearPassage({ contents, usfm }: PassageProps): JSX.Element {

    const [formattedContent, setFormattedContent] = useState<JSX.Element[]>([]);

    const store: Store = useStore();
    const activeToken = useSelector((state: RootState) => state.passage.activeToken);

    function setSelectedToken(data: any): void {
        const currentActiveToken = store.getState().passage.activeToken;
        if (currentActiveToken === data) {
            store.dispatch(setNoActiveToken());
        }
        else {
            if (data) {
                store.dispatch(setActiveToken(data));
            }
            else {
                store.dispatch(setNoActiveToken());
            }
        }
    }

    useEffect(() => {
        const formattedContent: JSX.Element[] = [];

        for (const content of contents) {
            formattedContent.push(<div className='label chapter'>{usfm.initialChapter}</div>);
            Object.entries(content).forEach(([verseNumber, verse]: any) => {

                Object.entries(verse).forEach(([wordNumber, word]: any) => {
                    const data = word;
                    const isSelected = activeToken && activeToken === data.strongs?.data;

                    let item = (
                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    className={ isSelected ? 'stack selected' : 'stack'}
                                    onClick={() => setSelectedToken(data.strongs?.data ?? null)}
                                >
                                    <span className={`${usfm.book}.${usfm.initialChapter}.${verseNumber} native`}>
                                        {data.native}
                                    </span>
                                    <span className='translit'>{data.translit}</span>
                                    <span className='english'>{data.eng}</span>
                                    <span className='translit'>
                                        {
                                            data.grammar ? data.grammar.map((g: any) => g.pos).join(' | ') : null
                                        }
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>{data.strongs.data ? data.strongs.data : 'Data not found'}</TooltipContent>
                        </Tooltip>
                    );

                    const startOfVerse = wordNumber === '1';
                    const endOfSentence = word.punct;

                    if (startOfVerse || endOfSentence) {
                        let pre = null;
                        let post = null;

                        // pre
                        if (startOfVerse) {
                            pre = <div className='label' id={`v${verseNumber}`}>{verseNumber}</div>;
                        }
                        // post
                        if (endOfSentence) {
                            post = <div className='punct'>{word.punct}</div>;
                        }

                        item = <span className='interlinear' style={{whiteSpace: 'nowrap'}}>{pre}{item}{post}</span>
                    }

                    formattedContent.push(item);
                });
            });
        }

        setFormattedContent(formattedContent);
    }, [contents, activeToken]);


    return (
        <div className='base'>
            <div className={`interlinear ${usfm.testament === 'old' ? 'hebrew' : 'greek'}`}>
                {formattedContent}
            </div>
        </div>
    );
}

type ConcordancePanelProps = {
    strongsNumber: string;
    createNewTab: (panelType: any, data: string) => void;
    currentBook?: string;
    translation: string;
    liteMode?: boolean;
};

export function ConcordancePanel({ strongsNumber, createNewTab, currentBook, translation, liteMode=false }: ConcordancePanelProps): JSX.Element {

    const fileManager = FileManager.getInstance();
    const [concordanceData, setConcordanceData]: [any, Function] = useState();

    useEffect(() => {
        setConcordanceData(undefined);
        fileManager.loadFromConcordance(strongsNumber).then((concordance) => {
            setConcordanceData(concordance);
        });
    }, [strongsNumber]);

    if (!concordanceData) {
        return (
            <div className='infoPanel'>
                <h4><span className='label'>({strongsNumber})</span></h4>
                Loading...
            </div>
        );
    }

    const occurences = liteMode ? concordanceData?.occurences?.slice(0, 9) : concordanceData?.occurences;
    if (liteMode && occurences?.length < concordanceData?.occurences?.length) {
        occurences.push('...');
    }

    const derive = locateStrongsReferences(concordanceData?.derive).map((d: any, i: number) => {
        if (d.match) {
            return <StrongsReference key={i} strongsNumber={d.match} currentBook={currentBook} translation={translation} />;
        }
        return <span>{d.text}</span>
    });

    return (
        <div className='infoPanel'>
            <div>
                <h4>{concordanceData?.native} <span className='label'>({strongsNumber})</span></h4>
                <div className='translit'>
                    <span>{concordanceData?.translit.org}</span>
                    <span> ({concordanceData?.pronunce})</span>
                </div>
                <div className='translit'>
                    <span>{concordanceData?.pos}</span>
                </div>
            </div>
            <div className='infoPanel-section'>
                <h4>Strong's Defintion</h4>
                <div className='description'>
                    {concordanceData?.define}
                </div>
                { derive ?
                    <div className='translit'>
                        {derive}
                    </div> : null
                }
            </div>

            { occurences ?
                <div className='infoPanel-section'>
                    <h4>Occurrences <span className='label'>({concordanceData?.occurences?.length})</span></h4>
                    <ul>
                        {occurences.map((occurence: any, index: number) => {
                            const reference = getUSFM(occurence);
                            if (!reference || !reference[0]) {
                                return <li key={index}>{occurence}</li>;
                            }
                            return (
                                <li key={index}>
                                    <BibleReference
                                        text={getReferenceText(reference[0])} usfm={reference[0]}
                                        loadPassage={function (usfm: any, isFootnote: boolean, openInNewTab?: boolean | undefined): void {
                                            createNewTab(WindowTypes.Scripture, getReferenceText(usfm));
                                        }}
                                        currentBook={currentBook ?? ''} translation={translation} />
                                </li>
                            );
                        })}
                    </ul>
                </div>
                : null
            }
        </div>
    );
}

type StrongsReferenceProps = {
    strongsNumber: string;
    forceText?: string;
    currentBook?: string;
    translation: string;
}

export function StrongsReference({ strongsNumber, forceText, currentBook, translation }: StrongsReferenceProps): JSX.Element | null {

    const [concordanceData, setConcordanceData]: [any, Function] = useState();

    useEffect(() => {
        const fileManager = FileManager.getInstance();
        fileManager.loadFromConcordance(strongsNumber).then((concordance) => {
            setConcordanceData(concordance);
        });
    }, [strongsNumber]);

    if (!concordanceData) {
        return <span>{forceText ?? strongsNumber}</span>;
    }

    // contents of footnote popover
    return (
        <OverlayTrigger trigger={['hover', 'focus']} placement="auto-start"
            overlay={
                <InnerPopover id='popover-basic'>
                    <div className='popver-mini'>
                        <ConcordancePanel
                            strongsNumber={strongsNumber}
                            createNewTab={() => {}}
                            currentBook={currentBook}
                            translation={translation}
                            liteMode={true}
                        />
                    </div>
                </InnerPopover>
            }
        >
            <span
                className='strongs'
                onMouseEnter={updatePopoverContents}
            >
                {forceText ?? concordanceData.native}
            </span>
        </OverlayTrigger>
    );

    async function updatePopoverContents(): Promise<any> {
    }
}

const InnerPopover = forwardRef(
    ({ popper, children, show: _, ...props }: any, ref: any) => {
        useEffect(() => {
            popper.scheduleUpdate(); // update positioning
        }, [children, popper]);

        return (
            <Popover ref={ref} body {...props}>
                {children}
            </Popover>
        );
    },
);
