import { useEffect, useState } from "react";

/**
 * Detect if the user currently presses or releases a mouse button.
 */
export function usePointerInteraction() {
    const [isPointerDown, setIsPointerDown] = useState(false);

    useEffect(() => {
        const handlePointerUp = () => {
            setIsPointerDown(false);
            document.removeEventListener("pointerup", handlePointerUp);
        };

        const handlePointerDown = () => {
            setIsPointerDown(true);
            document.addEventListener("pointerup", handlePointerUp);
        };

        document.addEventListener("pointerdown", handlePointerDown);
            return () => {
                document.removeEventListener("pointerdown", handlePointerDown);
            };
    }, []);

    return isPointerDown;
}