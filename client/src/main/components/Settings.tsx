import React, { useEffect, useState } from "react";
import { Alert, OverlayTrigger } from "react-bootstrap";

import { isElectronApp } from "../utils/general";
import SettingsManager from "../utils/SettingsManager";
import Select from "./common/Select";
import { loadTranslationList } from "../utils/ScriptureHelper";
import { Tooltip, TooltipContent, TooltipTrigger } from "./common/Tooltip";
import { Theme, useTheme } from "./ThemeContext";
import { BibleReference, InnerPopover } from "./scripture/Footnote";
import Passage from "./scripture/Passage";
import { getUSFM } from "../utils/bibleReferences";


function Settings() {

    const [translationsList, setTranslationsList] = useState<any[]>([]);

    const settings = SettingsManager.getInstance();
    const { theme: activeTheme, setTheme } = useTheme();

    const defaultTranslation = settings.getSetting('defaultTranslation');
    const theme = settings.getSetting('theme');

    const themesList = [
        {name: 'Light', options: [
            // we have some fun 'coats of many colours' for the themes
            // { name: 'Light of the World', reference: 'John 8:12' },
            { name: 'Morning Star', reference: 'Revelation 22:16' },
            // { name: 'City on a Hill', reference: 'Matthew 5:14-16' },
            // { name: 'Footlamp', reference: 'Psalm 119:105' },
        ]},
        {name: 'Mixed', options: [
            { name: 'Pillar of Fire', reference: 'Exodus 13:21' },
            // { name: 'Starry Heavens', reference: 'Psalm 8:3' },
        ]},
        {name: 'Dark', options: [
            { name: 'Night Watch', reference: 'Psalm 63:6-8' },
            // { name: 'Midnight Prayer', reference: 'Acts 16:25-26' },
        ]},
    ].map((theme) => {
        const coat = theme.options[Math.floor(Math.random() * theme.options.length)];
        const usfm = getUSFM(coat.reference);
        return {
            name: coat.name,
            key: theme.name,
            icon: `themes/${theme.name.toLowerCase()}`,
            element:
                <BibleReference key={theme.name} text={coat.reference} usfm={usfm ? usfm[0] : null} loadPassage={function (usfm: object, isFootnote: boolean, openInNewTab?: boolean | undefined): void {
                    throw new Error("Function not implemented.");
                } } currentBook='' translation={defaultTranslation} allowClickPropagation={false} >
                    <div className='select-option'>
                        <span className='flex-left'>
                            <img src={`/bible-app/icons/themes/${coat.name}.svg`} alt={`${theme.name} Theme`}/>
                            {coat.name}

                            {theme.name === 'Light' ?
                                <Tooltip placement='top'>
                                    <TooltipTrigger><img src='/bible-app/icons/warn.svg' alt='Warning'/></TooltipTrigger>
                                    <TooltipContent>Work in Progress!</TooltipContent>
                                </Tooltip>
                            : null}
                        </span>
                    </div>
                </BibleReference>
        };
    });

    useEffect(() => {
        void getTranslationList();
    }, []);

    async function getTranslationList(): Promise<void> {
        loadTranslationList(
            setTranslationsList,
            (selection: any) => updateSetting('defaultTranslation', selection)
        );
    }

    function updateSetting(setting: string, selection: any) {
        if (selection.key) {
            settings.setSetting(setting, selection.key);
        }
        else if (selection) {
            settings.setSetting(setting, selection);
        }
    }

    return (
        <div className='scroll' style={{maxHeight: 'calc(100vh - 32px)'}}>
            <div className='landing-content'>
                {
                    isElectronApp() ? null :
                    <Alert variant='warning'>
                        <Alert.Heading>⚠</Alert.Heading>
                        <p>Any changes made will be lost when you exit or refresh the page!</p>
                    </Alert>
                }

                <div>Default Translation:</div>
                <div style={{display: 'inline-block'}}>
                    <Select
                        entries={translationsList}
                        forcedIndex={translationsList.findIndex((translation) => translation?.key === defaultTranslation)}
                        setSelected={(selection) => updateSetting('defaultTranslation', selection)}
                        icon='translation'
                    />
                </div>

                <div>Theme:</div>
                <div style={{display: 'inline-block'}}>
                    <Select
                        entries={themesList}
                        forcedIndex={themesList.findIndex((option) => option?.key === theme)}
                        setSelected={(selection: any) => { updateSetting('theme', selection); setTheme(selection as Theme);}}
                    />
                </div>
            </div>
        </div>
    );
}

export default Settings;
