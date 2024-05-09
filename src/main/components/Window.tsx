import React from 'react';
import { Alert } from 'react-bootstrap';

import Document from './Document';
import Scripture from './scripture/Scripture';

import { WindowTypes } from '../utils/enums';

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
        case WindowTypes.Settings.Type:
            return (
                <Alert variant="danger">
                    <Alert.Heading>404</Alert.Heading>
                    <p>
                        Error: settings not found.
                    </p>
                </Alert>
            );
        default:
            return (
                null
            );
    }

}

export default Window;