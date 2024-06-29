import React, { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";

import { isElectronApp } from "../utils/general";
import SettingsManager from "../utils/SettingsManager";
import Select from "./common/Select";
import { loadTranslationList } from "../utils/ScriptureHelper";
import { Tooltip, TooltipContent, TooltipTrigger } from "./common/Tooltip";
import { Theme, useTheme } from "./ThemeContext";


function Settings() {

    const [translationsList, setTranslationsList] = useState<any[]>([]);

    const settings = SettingsManager.getInstance();
    const { theme: activeTheme, setTheme } = useTheme();

    const themesList = [
        {name: 'Light'},
        {name: 'Mixed'},
        {name: 'Dark'},
    ].map((theme) => {
        return {
            name: theme.name,
            key: theme.name,
            icon: `theme${theme.name}`,
            element: <div className='select-option'>
            <span className='flex-left'>
                <img src={`/bible-app/icons/theme${theme.name}.svg`} alt={`${theme.name} Theme`}/>
                {theme.name}

                {theme.name === 'Light' ?
                    <Tooltip>
                        <TooltipTrigger><img src='/bible-app/icons/warn.svg' alt='Warning'/></TooltipTrigger>
                        <TooltipContent>WIP</TooltipContent>
                    </Tooltip>
                : null}
            </span>
        </div>
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

    const defaultTranslation = settings.getSetting('defaultTranslation');
    const theme = settings.getSetting('theme');

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
