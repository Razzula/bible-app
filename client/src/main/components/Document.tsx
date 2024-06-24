import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

import '../styles/document.scss'
import '../styles/editor.scss';
import { isElectronApp } from '../utils/general';
import { Alert } from 'react-bootstrap';

type DocumentProps = {
    initialContents: string | null;
}

/**
 * A React component to display ...
 * @returns {JSX.Element}
 */
function Document({ initialContents }: DocumentProps): JSX.Element {

    function handleEditorChange(content: string, editor: any): void {
        // do something
    }

    // GENERATE JSX
    return (
        <>
            <div className='document'>
                {
                    isElectronApp() ? null :
                    <Alert variant="warning">
                        <Alert.Heading>⚠</Alert.Heading>
                        <p>This feature is currently not implemented. Any changes made are not stored, and features are very limited.</p>
                    </Alert>
                }

                {/* @ts-ignore */}
                <Editor
                    initialValue={initialContents || ''}
                    init={{
                        licenseKey: 'gpl',
                        // tinymceScriptSrc: 'http://localhost:3180/tinymce/tinymce.min.js', // this did not work, and so is added to index.html

                        plugins: [
                            'autoresize'
                        ],

                        setup: (editor) => {
                            editor.on('init', () => {
                                // do something
                            });
                        },

                        menubar: false,
                        toolbar: false,
                        statusbar: false,
                        branding: false,
                        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }',
                    }}
                    onEditorChange={handleEditorChange}
                />
            </div>
        </>
    );
}

export default Document;