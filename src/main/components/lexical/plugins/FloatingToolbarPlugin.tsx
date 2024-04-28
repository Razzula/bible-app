import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { useEffect, useCallback } from 'react';

import { usePointerInteraction } from '../../../hooks/usePointerInteractions';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useDispatch } from 'react-redux';
import { activatePassage, deactivatePassage } from '../../../../main/redux/actions';

type FloatingToolbarPluginProps = {
    editorRef: any;
};

/**
 * A Lexical plugin to display a floating toolbar.
 */
export function FloatingToolbarPlugin({ editorRef }: FloatingToolbarPluginProps): null {

    const [editor] = useLexicalComposerContext();

    const isPointerDown = usePointerInteraction();

    const dispatch = useDispatch();

    /**
     * When the pointer is no longer down, regenerate the function to calculate the position of the floating toolbar.
     */
    const triggerPopover = useCallback(() => {

        if (!isPointerDown) {
            dispatch(activatePassage(editorRef, editor));
        }

    }, [isPointerDown]);

    /**
     * Handle when there is a change in the selection of the lexical editor's text.
     */
    const handleSelectionChange = useCallback(() => {

        // ensure that the editor is focused and not in composition mode
        if (editor.getRootElement() !== document.activeElement || editor.isComposing()) {
            return;
        }

        // is there a range selection?
        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.anchor.is(selection.focus)) {
            triggerPopover();
        }
        else {
            dispatch(deactivatePassage());
        }
    }, [editor, triggerPopover]);

    /**
     * Register a listener to handle selection changes.
     */
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => handleSelectionChange());
        });
    }, [editor, handleSelectionChange]);

    /**
     * Manually trigger the selection change handler when the editor is first mounted.
     */
    useEffect(() => {

        editor.getEditorState().read(() => handleSelectionChange());
        // Adding show to the dependency array causes an issue if
        // a range selection is dismissed by navigating via arrow keys.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleSelectionChange, editor]);

    return null;

}
