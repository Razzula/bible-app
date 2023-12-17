import React from 'react';

import '../styles/tabbar.scss'

type TabbarProps = {
    activeTabs: Map<string, JSX.Element>;
    selectTab: (tabName: string) => void;
    closeTab: (tabName: string) => void;
    selectedTab?: string;
}

function Tabbar({ activeTabs, selectedTab, selectTab, closeTab }: TabbarProps): JSX.Element {

    // const [selectedTab, setSelectedTab]: [string | undefined, Function] = useState(undefined);

    const tabs = Array.from(activeTabs.keys()).map((tabName) => {
        return (
            <Tab key={tabName} tabName={tabName} selectTab={handleTabClick} closeTab={closeTab} isSelected={tabName === selectedTab} />
        );
    })

    function handleTabClick(tabName: string): void {
        selectTab(tabName);
    }

    return (
        <div className="tabbar">
            {tabs}
        </div>
    );
}

type TabProps = {
    tabName: string;
    selectTab: (tabName: string) => void;
    closeTab: (tabName: string) => void;
    isSelected: boolean;
}

function Tab({ tabName, selectTab, closeTab, isSelected }: TabProps): JSX.Element {

    const className = isSelected ? 'tab selected' : 'tab';

    const handleClick = (e: React.MouseEvent) => {
        switch (e.button) {
            case 0: // left click
                selectTab(tabName);
                break;
            case 1: // middle click
                closeTab(tabName)
                break;
            case 2: // right click
                break;
            default:
                break;
        }
    };

    return (
        <span onMouseUp={handleClick} key={tabName} className={className}>
            {/* ICON */}
            <span>{tabName}</span>

            <button onClick={() => closeTab(tabName)} className="tab-close-button">x</button>
        </span>
    );
}

export default Tabbar;
