import React, { useEffect } from 'react';

import Window from './Window';
import Tabbar from './Tabbar';
import Sidebar from './Sidebar';
import Sidepanel from './Sidepanel';

function Page() {

    const [windowsList, setWindowsList] = React.useState(new Map<string, JSX.Element>());

    const [activeWindow, setActiveWindow]: [Window| null, Function] = React.useState(null); //temp name

    const [selectedPanel, setSelectedPanel]: [symbol | undefined, Function] = React.useState(undefined);

    function updateSelectedPanel(button?: symbol) {
        setSelectedPanel(button);
    }

    function createNewTab(type: symbol, name: string) {
        //TODO: replace with uuid
        setWindowsList((currentWindowsList: Map<string, JSX.Element>) => {
            const newWindowsList = new Map<string, JSX.Element>(currentWindowsList);
            newWindowsList.set(name, <Window windowToLoad={type} data={name} />);

            return newWindowsList;
        });
    }

    function selectTab(tabWindow: string) {
        setActiveWindow(windowsList.get(tabWindow));
    }

    return (
        <div className='page' style={{display:'flex'}}>
            <Sidebar updateSelectedPanel={updateSelectedPanel} />
            <Sidepanel panelType={selectedPanel} createNewTab={createNewTab} />

            <div style={{flex: 1}}>
                <Tabbar activeTabs={windowsList} selectTab={selectTab} />
                {/* TODO: place Windows in container */}
                {/* <Window windowToLoad={activeWindow} /> */}
                {activeWindow}
            </div>
        </div>
    );

}

export default Page;