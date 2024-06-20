import React, { useState } from 'react';

import { WindowTypes } from '../utils/enums';
import { Tooltip, TooltipTrigger, TooltipContent } from './common/Tooltip';

import '../styles/sidebar.scss';

type SidebarProps = {
    updateSelectedPanel: (panelType: symbol | undefined) => void;
    selectTab: (type: any, name: string) => void;
}

function Sidebar({ updateSelectedPanel, selectTab }: SidebarProps): JSX.Element {

    const [selectedButton, setSelectedButton]: [symbol | undefined, Function] = useState(undefined);

    function handleButtonClick(button: any): void {
        setSelectedButton((currentSelection: any | undefined) => {
            const selection = (button === currentSelection) ? undefined : button;

            updateSelectedPanel(selection);
            return selection;

        });
    }

    return (
        <div className="sidebar">
            <div className="top-container">
                <SidebarButton buttonType={WindowTypes.Scripture} selectedButton={selectedButton} handleButtonClick={handleButtonClick} />
                <SidebarButton buttonType={WindowTypes.Resource} selectedButton={selectedButton} handleButtonClick={handleButtonClick} />
                <SidebarButton buttonType={WindowTypes.Document} selectedButton={selectedButton} handleButtonClick={handleButtonClick} />
            </div>

            <div className="bottom-container">
                <SidebarButton buttonType={WindowTypes.Settings} selectedButton={selectedButton} handleButtonClick={() => selectTab(WindowTypes.Settings, WindowTypes.Settings.name)} />
            </div>
        </div>
    );

}

function SidebarButton({ buttonType, selectedButton, handleButtonClick }: { buttonType: any, selectedButton: any, handleButtonClick: Function }) {

    const className = (selectedButton?.type === buttonType.type) ? 'sidebar-button selected' : 'sidebar-button';

    return (
        <Tooltip placement='right'>
            <TooltipTrigger>
                <button onClick={() => handleButtonClick(buttonType)} className={className}>
                    <img src={buttonType.iconPath} style={{width: 24}} alt={buttonType.name}/>
                </button>
            </TooltipTrigger>
            <TooltipContent>{buttonType?.name}</TooltipContent>
        </Tooltip>
    );

}

export default Sidebar;