import React from 'react';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

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

    function onError(error: Error): void {
        console.error(error);
    }

    // GENERATE JSX
    return (
        <>
            <div className='document'>
                <LexicalComposer initialConfig={{
                    namespace: 'name',
                    onError,
                    // editorState: JSON.stringify(initialNoteContents)
                }}>
                    <div className="editor-container">
                        <RichTextPlugin
                            contentEditable={<ContentEditable className="editor-input" />}
                            placeholder={<div className="editor-placeholder">Enter some plain text...</div>}
                            ErrorBoundary={LexicalErrorBoundary}
                        />
                    </div>
                    {/* <OnChangePlugin onChange={handleChange} /> */}
                    <HistoryPlugin />
                </LexicalComposer>
            </div>
        </>
    );
}

export default Document;