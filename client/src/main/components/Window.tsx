import React from 'react';
import { Alert } from 'react-bootstrap';

import Document from './Document';
import Scripture from './scripture/Scripture';

import { WindowTypes } from '../utils/enums';
import Resource from './Resource';
import { isElectronApp } from '../utils/general';
import Settings from './Settings';

type WindowProps = {
    windowToLoad: symbol;
    data: string;
    createNewTab: (panelType: symbol, data: string) => void;
}

function Window({ windowToLoad, data, createNewTab }: WindowProps): JSX.Element | null {

    switch (windowToLoad) {
        case WindowTypes.Scripture.type:
            return (
                <Scripture queryToLoad={data} createNewTab={createNewTab} />
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
                                    <p>2. Due to copyright restrictions, most Bible translations available only include  a <i>very</i> small number of chapters. (More information <a href='https://github.com/Razzula/bible-app/tree/main/example/Scripture'>here</a>). However, the entirety of the Bible is available using the <a>WEBBE</a> translation.</p>
                                    <hr />
                                    <p>
                                        If you would like to use the full version of the application, you can clone the <a href='https://github.com/Razzula/bible-app'>repository</a> and run it locally.
                                    </p>
                                </Alert>
                            }
                        <p>You can report any issues encountered, <a href='https://github.com/Razzula/bible-app/issues'>here</a>.</p>
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