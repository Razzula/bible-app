import React, { useState, useContext, createContext, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import '../../styles/common.scss';

interface AccordionOptions {
    multiple?: boolean;
}

export function useAccordion({ multiple = false }: AccordionOptions = {}) {
    const [openSections, setOpenSections] = useState<Set<number>>(new Set());

    const toggleSection = (index: number) => {
        setOpenSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                if (!multiple) {
                    newSet.clear();
                }
                newSet.add(index);
            }
            return newSet;
        });
    };

    const isOpen = (index: number) => openSections.has(index);

    return {
        toggleSection,
        isOpen,
    };
}

type ContextType = ReturnType<typeof useAccordion> | null;

const AccordionContext = createContext<ContextType>(null);

export const useAccordionContext = () => {
    const context = useContext(AccordionContext);

    if (context == null) {
        throw new Error('Accordion components must be wrapped in <Accordion />');
    }

    return context;
};

export function Accordion({ children, ...options }: { children: React.ReactNode } & AccordionOptions) {
    const accordion = useAccordion(options);

    return (
        <AccordionContext.Provider value={accordion}>
            <div className='accordion'>{children}</div>
        </AccordionContext.Provider>
    );
}

export const AccordionHeader = React.forwardRef<
    HTMLElement,
    React.HTMLProps<HTMLElement> & { asChild?: boolean; index: number }
>(function AccordionHeader({ children, asChild = false, index, ...props }, propRef) {
    const { toggleSection, isOpen } = useAccordionContext();

    const handleClick = () => {
        toggleSection(index);
    };

    const isExpanded = isOpen(index);

    return React.createElement(
        asChild ? React.Fragment : 'div',
        {
            ...props,
            ref: propRef,
            onClick: handleClick,
            className: `accordion-header ${isExpanded ? 'expanded' : ''}`,
        },
        <>
            {children}
            <img className='arrow' src='/bible-app/icons/drop.svg' />
        </>
    );
});

export const AccordionContent = forwardRef<
    HTMLDivElement,
    React.HTMLProps<HTMLDivElement> & { index: number }
>(function AccordionContent({ style, index, children, ...props }, ref) {
    const { isOpen } = useAccordionContext();
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<string | number>('0px');

    useImperativeHandle(ref, () => contentRef.current!);

    useEffect(() => {
        if (contentRef.current) {
            setHeight(isOpen(index) ? `${contentRef.current.scrollHeight}px` : '0px');
        }
    }, [isOpen, index]);

    return (
        <div
            {...props}
            ref={contentRef}
            style={{ ...style, height, overflow: 'hidden' }}
            className='accordion-content'
        >
            {children}
        </div>
    );
});
