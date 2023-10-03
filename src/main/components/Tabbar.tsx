import React from 'react';

import '../styles/tabbar.scss'

type Tabbar = {
    activeTabs: Map<string, JSX.Element>;
    selectTab: Function;
    closeTab: Function;
    selectedTab?: string;
}

function Tabbar({activeTabs, selectedTab, selectTab, closeTab}: Tabbar) {

    // const [selectedTab, setSelectedTab]: [string | undefined, Function] = React.useState(undefined);

    const tabs = Array.from(activeTabs.keys()).map((tabName) => {
        return (
            <Tab tabName={tabName} selectTab={handleTabClick} closeTab={closeTab} isSelected={tabName == selectedTab} />
        );
    })

    function handleTabClick(tabName: string) {
        // setSelectedTab(tabName);

        selectTab(tabName);
    }

    return (
        <div className="tabbar">
            {tabs}
        </div>
    );
}

type Tab = {
    tabName: string;
    selectTab: Function;
    closeTab: Function;
    isSelected: boolean;
}

function Tab({tabName, selectTab, closeTab, isSelected}: Tab) {

    const className = isSelected ? 'tab selected' : 'tab';

    return (
        <span onClick={() => selectTab(tabName)} key={tabName} className={className}>
            {/* ICON */}
            <span>{tabName}</span>

            <button onClick={() => closeTab(tabName)} className="tab-close-button">x</button>
        </span>
    );
}

export default Tabbar;
