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
                <Resource rootResourcePath='MHC' resourceFileName='preface.html' createNewTab={createNewTab} />
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
                                <p>
                                    Whilst this demo does host some passages from the Bible in order to function,
                                    it only provides a very small number of these, due to copyright constraints.
                                    These can be accessed from the <code>Scripture</code> tab, however any only this small subset of the Bible is available.
                                </p>
                                <p>For more information, including which translations and chapters are inclued, please refer to the <a href='https://github.com/Razzula/bible-app/tree/main/example/Scripture'>README</a>.</p>
                                <p>
                                    There are also some additional texts included in the <code>Resources</code>, which are in the public domain,
                                    however, these have also been reduced to a smaller subset, in order to minimise the size of the demo.
                                    </p>
                                <p>Additionally, please not that this is a static site, and therefore some functionalities, such as saving notes, is not available.</p>
                                <hr />
                                <p>
                                    If you would like to use the full version of the application, please clone the <a href='https://github.com/Razzula/bible-app'>repository</a> and run it locally.
                                </p>
                            </Alert>
                        }
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