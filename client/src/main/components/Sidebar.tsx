import React, { useState } from 'react';

import { WindowTypes } from '../utils/enums';

import '../styles/sidebar.scss';

type SidebarProps = {
    updateSelectedPanel: (panelType: symbol | undefined) => void;
    selectTab: (type: symbol, name: string) => void;
}

function Sidebar({ updateSelectedPanel, selectTab }: SidebarProps): JSX.Element {

    const [selectedButton, setSelectedButton]: [symbol | undefined, Function] = useState(undefined);

    function handleButtonClick(button: symbol): void {
        setSelectedButton((currentSelection: symbol | undefined) => {
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
                <button className='sidebar-button' onClick={() => selectTab(WindowTypes.Settings.Type, WindowTypes.Settings.Name)}>
                    <img src='/bible-app/icons/settings.svg' alt='Settings'/>
                </button>
            </div>
        </div>
    );

}

function SidebarButton({ buttonType, selectedButton, handleButtonClick }: { buttonType: any, selectedButton: any, handleButtonClick: Function }) {

    const className = (selectedButton === buttonType) ? 'sidebar-button selected' : 'sidebar-button';

    let buttonIcon;
    switch (buttonType) {
        case WindowTypes.Scripture:
            buttonIcon = <img src='/bible-app/icons/Scripture.svg' alt='Scripture'/>
            break;
        case WindowTypes.Resource:
            buttonIcon = <img src='/bible-app/icons/resource.svg' alt='Resources'/>
            break;
        case WindowTypes.Document:
            buttonIcon = <img src='/bible-app/icons/document.svg' alt='Documents'/>
            break;
    }

    return (
        <button onClick={() => handleButtonClick(buttonType.Type)} className={className}>
            {buttonIcon ?? buttonType.Name}
        </button>
    );

}

export default Sidebar;