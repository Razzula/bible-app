import React, { forwardRef } from "react";
import { Button } from "react-bootstrap";
import { LexicalEditor } from "lexical/LexicalEditor";
import { FORMAT_TEXT_COMMAND } from "lexical";

import { FloatingMenu, FloatingMenuCoords } from "../FloatingMenu";

type FloatingToolbarProps = {
    editor: LexicalEditor;
    coords: FloatingMenuCoords;
};

/**
 * A Lexical plugin to display a floating toolbar.
 */
export const FloatingToolbar = forwardRef<HTMLDivElement, FloatingToolbarProps>(

    function FloatingToolbar({ editor, coords }, ref) {

        const shouldShow = coords !== undefined;
        // console.log("FloatingToolbar", shouldShow, coords);

        return (
            <FloatingMenu ref={ref} coords={coords}>
                <Button
                    // icon="bold"
                    aria-label="Format text as bold"
                    // active={state.isBold}
                    onClick={() => {
                        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                    }}
                >
                    BOLD
                </Button>
            </FloatingMenu>
        );
    }
);
