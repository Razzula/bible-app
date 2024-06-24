import React from 'react';
import { Alert } from 'react-bootstrap';

import Document from '../Document';
import Scripture from '../scripture/Scripture';

import { WindowTypes } from '../../utils/enums';
import Resource from '../Resource';
import { isElectronApp } from '../../utils/general';
import Settings from '../Settings';
import Interlinear, { StrongsReference } from '../Interlinear';
import { BibleReference } from '../scripture/Footnote';
import SettingsManager from '../../utils/SettingsManager';

type WindowProps = {
    windowToLoad: symbol;
    data: string;
    createNewTab: (panelType: any, data: string) => void;
}

function Window({ windowToLoad, data, createNewTab }: WindowProps): JSX.Element | null {

    const settings = SettingsManager.getInstance();
    const translation = settings.getSetting('defaultTranslation');

    switch (windowToLoad) {
        case WindowTypes.Scripture.type:
            return (
                <Scripture id={data} queryToLoad={data} createNewTab={createNewTab} />
            );
        case WindowTypes.Interlinear.type:
            return (
                <Interlinear queryToLoad={data} createNewTab={createNewTab} />
            );
        case WindowTypes.Document.type:
            return (
                <Document initialContents={null} />
            );
        case WindowTypes.Resource.type:
            return (
                <Resource rootResourcePath={data} resourceFileName='preface.html' createNewTab={createNewTab} />
            );
        case WindowTypes.Settings.type:
            return (
                <Settings />
            );
        case WindowTypes.Landing.type:
            return (
                <div className='scroll' style={{maxHeight: 'calc(100vh - 32px)'}}>
                    <div className='landing-content'>
                        <p>Hello,</p><p>Welcome to <b>razzula/bible-app</b>!</p>
                            {
                                isElectronApp() ? null :
                                <Alert variant="warning">
                                    <Alert.Heading>⚠</Alert.Heading>
                                    <p>You are using a <u><b>demo</b></u> version of the application!</p>
                                    <p>1. Any changes made (creating or updating notes) are <b>not</b> saved.</p>
                                    <p>2. Due to copyright restrictions, most Bible translations available only include  a <i>very</i> small number of chapters. (More information <a href='https://github.com/Razzula/bible-app/tree/main/example/Scripture' target='_blank'>here</a>). However, the entirety of the Bible is available using the <a>WEBBE</a> translation.</p>
                                    <hr />
                                    <p>
                                        If you would like to use the full version of the application, you can clone the <a href='https://github.com/Razzula/bible-app' target='_blank'>repository</a> and run it locally.
                                    </p>
                                </Alert>
                            }
                        <p>
                            <span>Not sure where to start? How about </span>
                            <StrongsReference
                                strongsNumber='H7225'
                                forceText='bereshit'
                                currentBook='GEN'
                                translation={translation}
                            />
                            <span>, with </span>
                            <BibleReference
                                text='Genesis 1:1'
                                usfm={{ book: 'GEN', initialChapter: 1, initialVerse: 1 }}
                                loadPassage={() => createNewTab(WindowTypes.Scripture, 'GEN1.1')}
                                currentBook='GEN'
                                translation={translation}
                            />
                            <span>?</span>
                        </p>
                        <hr />
                        <p>You can report any issues encountered, <a href='https://github.com/Razzula/bible-app/issues' target='_blank'>here</a>.</p>
                        <p>:D</p>
                    </div>
                </div>
            );
        default:
            return (
                null
            );
    }

}

export default Window;