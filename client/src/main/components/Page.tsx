import React, { useEffect, useState } from 'react';

import Window from './Window';
import Tabbar from './Tabbar';
import Sidebar from './Sidebar';
import Sidepanel from './Sidepanel';
import { WindowTypes } from '../utils/enums';

function Page(): JSX.Element {

    const [windowsList, setWindowsList] = useState(new Map<string, JSX.Element>());
    const [tabsList, setTabsList] = useState(new Map<string, any>());

    const [activeWindow, setActiveWindow]: [Window | null, Function] = useState(null); //temp name

    const [selectedPanel, setSelectedPanel]: [symbol | undefined, Function] = useState(undefined);
    const [selectedTab, setSelectedTab]: [any | undefined, Function] = useState(undefined);

    useEffect(() => {
        createNewTab(WindowTypes.Landing, 'Welcome!');
    }, []);

    function updateSelectedPanel(button?: any): void {
        setSelectedPanel(button);
    }

    function createNewTab(type: any, name: string, hidePanel = false): void {
        //TODO: (BIBLE-64) replace with uuid
        setWindowsList((currentWindowsList: Map<string, JSX.Element>) => {
            const newWindowsList = new Map<string, JSX.Element>(currentWindowsList);

            const newWindow = <Window windowToLoad={type.type} data={name} createNewTab={createNewTab} />;
            newWindowsList.set(name, newWindow);

            setTabsList((currentTabsList: Map<string, any>) => {
                const newTabsList = new Map<string, any>(currentTabsList);

                const currentTab: any = { ...type };
                currentTab.key = name;
                newTabsList.set(name, currentTab);

                selectTabDirectly(currentTab);
                if (hidePanel) {
                    setSelectedPanel(undefined);
                }
                setActiveWindow(newWindow);

                return newTabsList;
            });
            return newWindowsList;
        });
    }

    function selectTab(tabWindow: string | null): void {
        setSelectedTab(tabWindow ? tabsList.get(tabWindow) : null);
        setActiveWindow(tabWindow ? windowsList.get(tabWindow) : null);
    }

    function selectTabDirectly(tab: any): void {
        setSelectedTab(tab);
        setActiveWindow(windowsList.get(tab.key));
    }

    function closeTab(name: string): void {

        setWindowsList((currentWindowsList: Map<string, JSX.Element>) => {
            const newWindowsList = new Map<string, JSX.Element>(currentWindowsList);
            newWindowsList.delete(name);
            return newWindowsList;
        });
        setTabsList((currentTabsList: Map<string, any>) => {
            const newTabsList = new Map<string, any>(currentTabsList);
            newTabsList.delete(name);

            if (selectedTab.key === name) {
                if (newTabsList.size === 0) {
                    selectTab(null);
                }
                else {
                    selectTabDirectly(Array.from(newTabsList.values())[0]);
                }
            }

            return newTabsList;
        });
    }

    return (
        <div className='page' style={{ display: 'flex' }}>
            <Sidebar updateSelectedPanel={updateSelectedPanel} selectTab={createNewTab} />
            <Sidepanel panelType={selectedPanel} createNewTab={createNewTab} />

            <div style={{ flex: 1 }}>
                <Tabbar tabs={tabsList} selectedTab={selectedTab} selectTab={selectTab} closeTab={closeTab} />
                {activeWindow}
            </div>
        </div>
    );

}

export default Page;