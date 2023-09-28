import React from 'react';

import Window from './Window';
import Tabbar from './Tabbar';
import Sidebar from './Sidebar';

function Page() {

    const [activeWindow, setActiveWindow] = React.useState('scripture');

    // TODO: handle tab 
    
    function handleSidebarButtonClick(button: string) {
        setActiveWindow(button);
    }

    return (
        <div className='page' style={{display:'flex'}}>
            <Sidebar handleButtonClick={handleSidebarButtonClick} />
            {/* TODO: Sidepanel */}
            <div style={{flex: 1}}>
                <Tabbar />
                {/* TODO: place Windows in container */}
                <Window windowToLoad={activeWindow} />
            </div>
        </div>
    );

}

export default Page;