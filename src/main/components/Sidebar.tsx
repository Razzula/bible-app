import React from 'react';
import { Nav } from 'react-bootstrap';

import '../styles/sidebar.scss';

type Sidebar = {
    updateSelectedPanel: Function
}

function Sidebar({updateSelectedPanel}: Sidebar) {

    const [selectedButton, setSelectedButton]: [string | undefined, Function] = React.useState(undefined);

    function handleButtonClick(button: string) {
        setSelectedButton((currentSelection: string | undefined) => {
            const selection = (button === currentSelection) ? undefined : button;

            updateSelectedPanel(selection);
            return selection;

        });
    }

    return (
        <div className="sidebar">
            <div className="top-container">
                <SidebarButton buttonName='scripture' isSelected={selectedButton === 'scripture'} handleButtonClick={handleButtonClick} />
                <SidebarButton buttonName='document' isSelected={selectedButton === 'document'} handleButtonClick={handleButtonClick} />
            </div>

            <div className="bottom-container">
                <button className='sidebar-button'>Settings</button>
            </div>
        </div>
    );

}

function SidebarButton({buttonName, isSelected, handleButtonClick}: {buttonName: string, isSelected: boolean, handleButtonClick: Function}) {

    const className = isSelected ? 'sidebar-button selected' : 'sidebar-button';

    return (
        <button onClick={() => handleButtonClick(buttonName)} className={className}>
            {buttonName}
        </button>
    );

}

export default Sidebar;