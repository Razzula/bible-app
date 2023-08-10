import React, { useState, cloneElement, useEffect } from 'react';

import Scripture from './scripture/Scripture';

import '../styles/dark.scss';
import '../styles/App.scss';

/**
 * A React component to display the main application.
 * @returns {JSX.Element} A JSX Element of a `div` containing the main application.
 */
function App() {

    // GENERATE JSX
    return (
        <>

            <Scripture />
            
        </>
    );
}

export default App;