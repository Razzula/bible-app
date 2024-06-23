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
            <Tab key={key} tabKey={key} tabName={value.name} tabType={value} isSelected={selectedTab?.key === value?.key} selectTab={handleTabClick} closeTab={closeTab} />
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
    tabKey: string;
    tabName: string;
    tabType: any;
    isSelected: boolean;
    selectTab: (tabName: string) => void;
    closeTab: (tabName: string) => void;
}

function Tab({ tabKey, tabName, tabType, isSelected, selectTab, closeTab }: TabProps): JSX.Element {

    const className = isSelected ? 'tab selected' : 'tab';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        switch (e.button) {
            case 0: // left click
                selectTab(tabKey);
                break;
            case 1: // middle click
                closeTab(tabKey)
                break;
            case 2: // right click
                break;
            default:
                break;
        }
    };

    return (
        <span onMouseDown={handleClick} key={tabKey} className={className}>
            <span className='flex-left'>
                {tabType ? <img src={tabType.iconPath} style={{width: 16}} alt={tabType.name}/> : null}
                <span className='tab-text'>{tabName}</span>
            </span>
            <button onClick={() => closeTab(tabName)} className="tab-close-button">x</button>
        </span>
    );
}

export default Tabbar;
