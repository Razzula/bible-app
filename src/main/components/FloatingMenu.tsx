import React, { forwardRef } from "react";

export type FloatingMenuCoords = { x: number; y: number } | undefined;

type FloatingToolbarProps = {
    children: JSX.Element;
    coords: FloatingMenuCoords;
};

/**
 * A React component to display a floating menu, at a given position, with a given set of children.
 */
export const FloatingMenu = forwardRef<HTMLDivElement, FloatingToolbarProps>(

    function FloatingMenu({ coords, children }, ref) {

        const shouldShow = coords !== undefined;

        return (
            <div
                ref={ref}
                className="flex items-center justify-between bg-slate-100 border-[1px] border-slate-300 rounded-md p-1 gap-1"
                aria-hidden={!shouldShow}
                style={{
                    position: 'absolute',
                    top: coords?.y,
                    left: coords?.x,
                    visibility: shouldShow ? 'visible' : 'hidden',
                    // opacity: shouldShow ? 1 : 0,
                }}
            >
                {children}
            </div>
        );
    }
);
