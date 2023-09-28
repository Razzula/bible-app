import React from 'react';

import Scripture from './scripture/Scripture';
import Document from './Document';

type Window = {
    windowToLoad: string;
}

function Window({windowToLoad}: Window) {

    switch (windowToLoad) {
        case 'scripture':
            return (
                <Scripture />
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