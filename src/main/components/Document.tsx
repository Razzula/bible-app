import React, { useState, cloneElement, useEffect } from 'react';

import { $getRoot, $getSelection } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { InitialEditorStateType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import '../styles/document.scss'
import '../styles/editor.scss';

type Document = {
    initialContents: any;
}

/**
 * A React component to display ...
 * @returns {JSX.Element}
 */
function Document({ initialContents }: Document): JSX.Element {

    function onError(error: any) {
        console.error(error);
    }

    // GENERATE JSX
    return (
        <>
            <div className='document'>
                <LexicalComposer initialConfig={{
                    namespace: 'name',
                    onError: onError,
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