import React from 'react';

import '../styles/tabbar.scss'

type Tabbar = {
    activeTabs: Map<string, JSX.Element>;
    selectTab: Function;
}

function Tabbar({activeTabs, selectTab}: Tabbar) {

    const [selectedTab, setSelectedTab]: [string | undefined, Function] = React.useState(undefined);

    const tabs = Array.from(activeTabs.keys()).map((tabName) => {
        return (
            <Tab tabName={tabName} selectTab={handleTabClick} isSelected={tabName == selectedTab} />
        );
    })

    function handleTabClick(tabName: string) {
        setSelectedTab(tabName);

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
    isSelected: boolean;
}

function Tab({tabName, selectTab, isSelected}: Tab) {

    const className = isSelected ? 'tab selected' : 'tab';
    console.log(tabName, className);

    return (
        <span onClick={() => selectTab(tabName)} key={tabName} className={className}>
            {/* ICON */}
            <span>{tabName}</span>

            <button className="tab-close-button">x</button>
        </span>
    );
}

export default Tabbar;
