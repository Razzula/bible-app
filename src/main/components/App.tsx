import React from 'react';

import Page from './Page';
import Sidebar from './Sidebar';

import '../styles/dark.scss';
import '../styles/App.scss';

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function App() {

    // GENERATE JSX
    return (
        <div className='App'>
            <Sidebar />
            <Page />
        </div>
    );
}

export default App;