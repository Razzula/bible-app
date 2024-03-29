import React from 'react';

import { WindowTypes } from '../utils/enums';

import Scripture from './scripture/Scripture';
import Document from './Document';

type WindowProps = {
    windowToLoad: symbol;
    data: string;
}

function Window({ windowToLoad, data }: WindowProps): JSX.Element | null {

    switch (windowToLoad) {
        case WindowTypes.Scripture.Type:
            return (
                <Scripture queryToLoad={data} />
            );
        case WindowTypes.Document.Type:
            return (
                <Document initialContents={null} />
            );
        default:
            return (
                null
            );
    }

}

export default Window;