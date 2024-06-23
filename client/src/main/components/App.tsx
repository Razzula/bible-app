import React, { useEffect } from 'react';

import Page from './browser/Page';

import '../styles/dark.scss';
import '../styles/App.scss';
import { isElectronApp } from '../utils/general';
import FileManager from '../utils/FileManager';

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function App(): JSX.Element {

    useEffect(() => {
        FileManager.getInstance(); // initialise the file manager
        // this will ping the backend to ensure it is running, in case of sleeping

        if (isElectronApp()) {
            console.log('Electron app detected');
            window.electronAPI.setupApp();
        }
    }, []);

    // GENERATE JSX
    return (
        <Page />
    );
}

export default App;