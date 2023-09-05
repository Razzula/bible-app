import React from 'react';

import Window from './Window';
import Tabbar from './Tabbar';

function Page() {

    return (
        <div className='page'>
            <Tabbar />
            <Window />
        </div>
    );

}

export default Page;