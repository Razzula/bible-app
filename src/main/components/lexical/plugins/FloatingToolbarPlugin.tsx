import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import React, { useRef, useEffect, useState, useCallback } from 'react';

import { createPortal } from 'react-dom';

import { FloatingToolbar } from '../FloatingToolbar';
import { FloatingMenuCoords } from '../../FloatingMenu';
import { computePosition } from '@floating-ui/dom';
import { usePointerInteraction } from '../../../hooks/usePointerInteractions';
import { $getSelection, $isRangeSelection } from 'lexical';

const DOM_ELEMENT = document.body;

/**
 * A Lexical plugin to display a floating toolbar.
 */
export function FloatingToolbarPlugin(): JSX.Element {

    const ref = useRef<HTMLDivElement>(null); // thsi re-renders so many times every click
    // console.log(ref);
    const [coords, setCoords] = useState<FloatingMenuCoords>(undefined);
    const [editor] = useLexicalComposerContext();

    const isPointerDown = usePointerInteraction();

    /**
     * When the pointer is no longer down, regenerate the function to calculate the position of the floating toolbar.
     */
    const calculatePosition = useCallback(() => {

        const domSelection = getSelection();
        const domRange = (domSelection?.rangeCount !== 0) && (domSelection?.getRangeAt(0));

        if (!domRange || !ref.current || isPointerDown) return setCoords(undefined);

        computePosition(domRange, ref.current, { placement: 'top' })
            .then(pos => { // set coordinates to the top of the selection
                console.log({ x: pos.x, y: pos.y - 10 });
                setCoords({ x: pos.x, y: pos.y - 10 });
            })
            .catch(() => { // do not display, as coordinates could not be computed
                setCoords(undefined);
            });
    }, [isPointerDown]);

    /**
     * TODO
     */
    const handleSelectionChange = useCallback(() => {

        // ensure that the editor is focused and not in composition mode
        if (editor.getRootElement() !== document.activeElement || editor.isComposing()) {
            setCoords(undefined);
            return;
        }

        const selection = $getSelection();
        if ($isRangeSelection(selection) && !selection.anchor.is(selection.focus)) {
            calculatePosition(); // calculate the position of the floating toolbar
        }
        else {
            setCoords(undefined);
        }
    }, [editor, calculatePosition]);

    /**
     * TODO
     */
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => handleSelectionChange());
        });
    }, [editor, handleSelectionChange]);

    /**
     * TODO
     */
    useEffect(() => {

        if (coords === undefined) {
            editor.getEditorState().read(() => handleSelectionChange());
        }
        // Adding show to the dependency array causes an issue if
        // a range selection is dismissed by navigating via arrow keys.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleSelectionChange, editor]);

    return createPortal(
        <FloatingToolbar ref={ref} editor={editor} coords={coords} />,
        DOM_ELEMENT
    );

}
