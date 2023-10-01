import React from 'react';

import '../styles/sidepanel.scss'

type Sidepanel = {
    panelType?: string;
    createNewTab: Function;
}

function Sidepanel({panelType, createNewTab} : Sidepanel) {

    let contents: JSX.Element | null = null;

    if (panelType === undefined) {
        return null;
    }

    contents = <button onClick={() => createNewTab(panelType)}>new {panelType}</button>;

    return (
        <div className="sidepanel">
            {contents}
        </div>
    );

}

export default Sidepanel;