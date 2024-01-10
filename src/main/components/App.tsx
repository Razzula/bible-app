import React from 'react';

import Page from './Page';

// import '../styles/DEBUG.scss'; // TODO: remove
import '../styles/dark.scss';
import '../styles/App.scss';


/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function App(): JSX.Element {

    window.electronAPI.setupApp();

    // GENERATE JSX
    return (
        <Page />
    );
}

export default App;