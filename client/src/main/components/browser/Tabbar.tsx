import React from 'react';

import '../../styles/tabbar.scss'

type TabbarProps = {
    tabs: Map<string, any>;
    selectTab: (tabName: string) => void;
    closeTab: (tabName: string) => void;
    selectedTab?: any;
}

function Tabbar({ tabs, selectedTab, selectTab, closeTab }: TabbarProps): JSX.Element {

    const tabElements = Array.from(tabs).map(([key, value]) => {
        return (
            <Tab key={key} tabName={key} tabType={value} isSelected={selectedTab?.key === value?.key} selectTab={handleTabClick} closeTab={closeTab} />
        );
    })

    function handleTabClick(tabName: string): void {
        selectTab(tabName);
    }

    return (
        <div className="tabbar">
            {tabElements}
        </div>
    );
}

type TabProps = {
    tabName: string;
    tabType: any;
    isSelected: boolean;
    selectTab: (tabName: string) => void;
    closeTab: (tabName: string) => void;
}

function Tab({ tabName, tabType, isSelected, selectTab, closeTab }: TabProps): JSX.Element {

    const className = isSelected ? 'tab selected' : 'tab';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
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
        <span onMouseDown={handleClick} key={tabName} className={className}>
            <span className='flex-left'>
                {tabType ? <img src={tabType.iconPath} style={{width: 16}} alt={tabType.name}/> : null}
                <span>{tabName}</span>
            </span>
            <button onClick={() => closeTab(tabName)} className="tab-close-button">x</button>
        </span>
    );
}

export default Tabbar;
