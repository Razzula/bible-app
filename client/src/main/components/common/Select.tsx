import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal, FloatingFocusManager, useInteractions, useClick, useDismiss, useRole, useListNavigation, useTypeahead } from '@floating-ui/react';
import React, { useEffect } from 'react';

interface SelectProps {
    entries: { name: string; key: string; element: React.ReactNode; }[],
    setSelected: (name: string) => void;
    defaultIndex?: number;
}

const Select: React.FC<SelectProps> = ({ entries, setSelected, defaultIndex }) => {

    const [isOpen, setIsOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(defaultIndex ?? null);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom',
        middleware: [offset(10), flip(), shift()],
        whileElementsMounted: autoUpdate,
    });

    const listRef = React.useRef<Array<HTMLElement | null>>([]);
    // const listContentRef = React.useRef(temp);
    // const isTypingRef = React.useRef(false);

    const click = useClick(context, { event: "mousedown" });
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: "listbox" });
    const listNav = useListNavigation(context, {
        listRef,
        activeIndex,
        selectedIndex,
        onNavigate: setActiveIndex,
        // This is a large list, allow looping.
        loop: true,
    });
    // const typeahead = useTypeahead(context, {
    //     listRef: listContentRef,
    //     activeIndex,
    //     selectedIndex,
    //     onMatch: isOpen ? setActiveIndex : setSelectedIndex,
    //     onTypingChange(isTyping) {
    //         isTypingRef.current = isTyping;
    //     },
    // });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
        [dismiss, role, listNav, click /*, typeahead */]
    );

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
        setIsOpen(false);
        setSelected(entries[index].name);
    };

    return (<>
        <div
            ref={refs.setReference}
            className='btn btn-primary'
            {...getReferenceProps()}
        >
            {selectedIndex !== null && selectedIndex >= 0 ? entries[selectedIndex]?.name : '...'}
        </div>

        {isOpen && (
            <FloatingPortal>
                <FloatingFocusManager context={context} modal={false}>
                    <div
                        className='select-options'
                        ref={refs.setFloating}
                        style={{
                            ...floatingStyles,
                            overflowY: "auto",
                            background: "#161819",
                            minWidth: 100,
                            borderRadius: 8,
                            outline: 0,
                        }}
                        {...getFloatingProps()}
                    >
                        {entries.map((entry, index) => (
                            <div
                                key={entry.key}
                                style={{
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleSelect(index)}
                            >
                                {entry.element}
                            </div>
                        ))}
                    </div>
                </FloatingFocusManager>
            </FloatingPortal>
        )}

    </>);
};

export default Select;
