import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

import '../styles/document.scss'
import '../styles/editor.scss';

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