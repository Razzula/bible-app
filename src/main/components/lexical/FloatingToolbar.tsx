import React, { forwardRef } from "react";
import { Button } from "react-bootstrap";
import { LexicalEditor } from "lexical/LexicalEditor";
import { FORMAT_TEXT_COMMAND } from "lexical";

type FloatingToolbarProps = {
    editor: LexicalEditor;
};

/**
 * A Lexical plugin to display a floating toolbar.
 */
export const FloatingToolbar = forwardRef<HTMLDivElement, FloatingToolbarProps>(

    function FloatingToolbar({ editor }) {

        return (
            <>
                {/* BOLD */}
                <Button
                    aria-label="Format text as bold"
                    onClick={() => {
                        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
                    }}
                >
                    B
                </Button>

                {/* ITALICS */}
                <Button
                    aria-label="Format text as italicised"
                    onClick={() => {
                        editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
                    }}
                >
                    I
                </Button>
            </>
        );
    }
);
