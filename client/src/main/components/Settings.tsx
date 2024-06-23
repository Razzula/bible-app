import React, { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";

import { isElectronApp } from "../utils/general";
import SettingsManager from "../utils/SettingsManager";
import Select from "./common/Select";
import { loadTranslationList } from "../utils/ScriptureHelper";


function Settings() {

    const [translationsList, setTranslationsList] = useState<any[]>([]);

    const settings = SettingsManager.getInstance();

    useEffect(() => {
        void getTranslationList();
    }, []);

    async function getTranslationList(): Promise<void> {
        loadTranslationList(setTranslationsList, updateSelectedTranslation);
    }

    function updateSelectedTranslation(translation: any) {
        if (translation.key) {
            settings.setSetting('defaultTranslation', translation.key);
        }
        else if (translation) {
            settings.setSetting('defaultTranslation', translation);
        }
    }

    const defaultTranslation = settings.getSetting('defaultTranslation');

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
                        setSelected={updateSelectedTranslation}
                        icon='translation'
                    />
                </div>
            </div>
        </div>
    );
}

export default Settings;
