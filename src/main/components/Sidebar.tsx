import React, { useState } from 'react';

import { WindowTypes } from '../utils/enums';

import '../styles/sidebar.scss';

type SidebarProps = {
    updateSelectedPanel: (panelType: symbol | undefined) => void;
}

function Sidebar({ updateSelectedPanel }: SidebarProps): JSX.Element {

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
                <SidebarButton buttonType={WindowTypes.Document} selectedButton={selectedButton} handleButtonClick={handleButtonClick} />
            </div>

            <div className="bottom-container">
                <button className='sidebar-button'>Settings</button>
            </div>
        </div>
    );

}

function SidebarButton({ buttonType, selectedButton, handleButtonClick }: { buttonType: any, selectedButton: any, handleButtonClick: Function }) {

    const className = (selectedButton === buttonType) ? 'sidebar-button selected' : 'sidebar-button';

    return (
        <button onClick={() => handleButtonClick(buttonType.Type)} className={className}>
            {buttonType.Name}
        </button>
    );

}

export default Sidebar;