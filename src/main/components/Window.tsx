import React from 'react';

import Scripture from './scripture/Scripture';
import Document from './Document';

type Window = {
    windowToLoad: string;
    data: string;
}

function Window({windowToLoad, data}: Window) {

    switch (windowToLoad) {
        case 'scripture':
            return (
                <Scripture queryToLoad={data} />
            );
        case 'document':
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