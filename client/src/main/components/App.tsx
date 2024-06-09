import React from 'react';

import Page from './Page';

import '../styles/dark.scss';
import '../styles/App.scss';
import { isElectronApp } from '../utils/general';
import FileManager from '../utils/FileManager';

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function App(): JSX.Element {

    FileManager.getInstance();

    if (isElectronApp()) {
        console.log('Electron app detected');
        window.electronAPI.setupApp();
    }

    // GENERATE JSX
    return (
        <Page />
    );
}

export default App;