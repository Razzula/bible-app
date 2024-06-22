import React from 'react';

import FileManager from './FileManager';
import SettingsManager from "./SettingsManager";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/common/Tooltip";
import { getBookUSFM, getReferenceText, getUSFM } from './bibleReferences';
import { WindowTypes } from './enums';
import Passage from '../components/scripture/Passage';
import { isElectronApp } from './general';
import { InterlinearPassage } from '../components/Interlinear';

const docID = 'Scripture';

export async function loadTranslationList(setTranslationsList: Function, setSelectedTranslation: Function, directory: string = 'Scripture'): Promise<void> {
    const translations = await FileManager.getInstance().getDirectories(directory);

    const translationList: any[] = translations.map((translation: any) => {
        let statePath, stateText;
        switch (translation.state) {
            case 'local':
                statePath = '/bible-app/icons/downloaded.svg';
                stateText='Available Offline';
                break;
            case 'demo':
                statePath = '/bible-app/icons/notDownloaded.svg';
                stateText='Partially Available (Demo)';
                break;
            case 'cloud':
            default:
                statePath = '/bible-app/icons/cloud.svg';
                stateText='Available Online';
                break;
        }

        return {
            'name': translation.short,
            'key': translation.short,
            'element': <div className='select-option'>
                <span className='flex-left'>
                    <Tooltip placement='left'>
                        <TooltipTrigger><img src={statePath} alt={stateText}/></TooltipTrigger>
                        <TooltipContent>{stateText}</TooltipContent>
                    </Tooltip>
                    {translation.short}
                </span>
                <span className='flex-right'>
                    <Tooltip placement='right-start'>
                            <TooltipTrigger><img src='/bible-app/icons/info.svg' alt='Info Icon' className='flex-right'/></TooltipTrigger>
                            <TooltipContent>
                                <div><b>{translation?.title}</b></div>
                                <div>{translation?.description}</div>
                            </TooltipContent>
                    </Tooltip>
                </span>
            </div>,
            'license': translation.license ?? 'PUBLIC_DOMAIN'
        };
    });

    setTranslationsList(translationList);
    if (directory === 'Scripture') {
        setSelectedTranslation(translationList.find((t) => t.name === SettingsManager.getInstance().getSetting('defaultTranslation')) ?? null);
    }
    else if (directory === 'interlinear') {
        setSelectedTranslation(translationList.find((t) => t.name === 'Interlinear') ?? null);
    }
}

export function loadPassageUsingString(searchQuery: string, selectedTranslation: any, loadPassageFromUSFM: Function, setSearchError: Function, clearForwardCache = false): void {

    if (searchQuery === undefined || searchQuery === null || searchQuery === '') {
        return;
    }
    if (selectedTranslation === undefined || selectedTranslation === null) {
        return;
    }

    let result = getUSFM(searchQuery);
    if (result.length > 0) {
        void loadPassageFromUSFM(result, clearForwardCache);
    }
    else {
        result = getBookUSFM(searchQuery);
        if (result) {
            console.log('TODO: (BIBLE-15) load BOOK.0');
            // TODO: it might be better to instead load a document tab
        }
        else {
            setSearchError(true);
        }
    }

}

export async function loadPassageUsingUSFM(
    usfm: any, selectedTranslation: any, clearForwardCache = false, openInNewTab = false, PassageType: typeof Passage | typeof InterlinearPassage, interlinear: boolean,
    createNewTab: Function, setPassages: Function, setSearchError: Function, setSearchQuery: Function, searchQuery: string,
    historyStacks: string[][], setHistoryStacks: Function, selectedNoteGroup: string | undefined, selectedRenderMode: string
): Promise<void> {

    if (openInNewTab) {
        createNewTab(WindowTypes.Scripture.type, getReferenceText(usfm));
        return;
    }

    const fileManager = FileManager.getInstance();

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
                // TODO: prevent multiple reads of current file

                // load contents externally from files
                const chapterContents = await fileManager.loadScripture(passageUsfm.book, chapter, selectedTranslation.name, interlinear);
                if (chapterContents) {
                    chaptersContents.push(chapterContents);
                }
                else {
                    if (!isElectronApp()) {
                        if (window.confirm('Warning: This is a demo environment. Only a limited selection of chapters are available.\n\n For more information, please see README.md')) {
                            window.open('https://github.com/Razzula/bible-app/tree/main/example/Scripture');
                        }
                    }
                }

            }

            if (chaptersContents.length === 0) {
                return;
            }

            const usfmString = getReferenceText(passageUsfm);
            return <PassageType
                key={usfmString} contents={chaptersContents} usfm={passageUsfm} translation={selectedTranslation?.name} loadPassage={loadPassageUsingUSFM} docID={docID} selectedNoteGroup={selectedNoteGroup} renderMode={selectedRenderMode}
            />;
        }).filter((passage: JSX.Element | undefined) => passage !== undefined)
    );

    // display passages
    if (passages) {
        setPassages(passages);
        setSearchError(false);
        setSearchQuery(getReferenceText(usfm)); // format, e.g 'gen1' --> 'Genesis 1'

        if (searchQuery !== undefined) {
            historyStacks[0].push(searchQuery)
        }
        if (clearForwardCache) {
            historyStacks[1] = new Array<string>();
        }
        setHistoryStacks(historyStacks);

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
    else {
        setSearchError(true);
    }

}
