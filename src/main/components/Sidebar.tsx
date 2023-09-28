import React from 'react';
import { Nav } from 'react-bootstrap';

type Sidebar = {
    handleButtonClick: (button: string) => void;
}

function Sidebar({handleButtonClick}: Sidebar) {

    return (
        <div className="sidebar">
            <button onClick={() => handleButtonClick('scripture')}>Scripture</button>
            <button onClick={() => handleButtonClick('document')}>Document</button>
            <button onClick={() => handleButtonClick('settings')}>Settings</button>
        </div>
    );

}

export default Sidebar;