import React from 'react';
import { Alert } from 'react-bootstrap';

import Document from './Document';
import Scripture from './scripture/Scripture';

import { WindowTypes } from '../utils/enums';
import Resource from './Resource';
import { isElectronApp } from '../utils/general';

type WindowProps = {
    windowToLoad: symbol;
    data: string;
    createNewTab: (panelType: symbol, data: string) => void;
}

function Window({ windowToLoad, data, createNewTab }: WindowProps): JSX.Element | null {

    switch (windowToLoad) {
        case WindowTypes.Scripture.Type:
            return (
                <Scripture queryToLoad={data} createNewTab={createNewTab} />
            );
        case WindowTypes.Document.Type:
            return (
                <Document initialContents={null} />
            );
        case WindowTypes.Resource.Type:
            return (
                <Resource rootResourcePath={data} resourceFileName='preface.html' createNewTab={createNewTab} />
            );
        case WindowTypes.Settings.Type:
            return (
                <div className='scroll'>
                    <Alert variant="danger">
                        <Alert.Heading>404</Alert.Heading>
                        <p>
                            Error: Settings are not yet implemented.
                        </p>
                    </Alert>
                </div>
            );
        case WindowTypes.Landing.Type:
            return (
                <div className='scroll'>
                    <div className='landing-content'>
                        <p>Hello,</p><p>Welcome to <b>razzula/bible-app</b>!</p>
                            {
                                isElectronApp() ? null :
                                <Alert variant="warning">
                                    <Alert.Heading>⚠</Alert.Heading>
                                    <p>You are using a <u><b>demo</b></u> version of the application!</p>
                                    <p>1. Only a very small number of Bible translations and chapters are included, due to copyright restrictions. (More information <a href='https://github.com/Razzula/bible-app/tree/main/example/Scripture'>here</a>).</p>
                                    <p>2. Only a small number of additional texts are included, to minimise the size of the demo.</p>
                                    <p>3. Any changes made (creating or saving notes) are <b>not</b> stored.</p>
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