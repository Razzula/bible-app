import React from 'react';

import FileManager from "./FileManager";
import SettingsManager from "./SettingsManager";
import { Tooltip, TooltipTrigger, TooltipContent } from "../components/common/Tooltip";

export async function loadTranslationList(setTranslationsList: Function, setSelectedTranslation: Function): Promise<void> {
    const translations = await FileManager.getInstance().getDirectories('Scripture');

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
    setSelectedTranslation(translationList.find((t) => t.name === SettingsManager.getInstance().getSetting('defaultTranslation')) ?? null);
}
