import React from 'react';
import parse from 'html-react-parser';

import 'tinymce/skins/ui/oxide/skin.min.css';

import { locateReferences } from '../../utils/bibleReferences';
import { BibleReference } from '../scripture/Footnote';

type ReadOnlyHTMLRendererProps = {
    actualHTMLContents: string;
    currentBook: string;
    translation: string;
    loadPassage: any;
}

function ReadOnlyHTMLRenderer({ actualHTMLContents, currentBook, translation, loadPassage }: ReadOnlyHTMLRendererProps): JSX.Element | null {

    const transform = (domNode: any) => {
        if (domNode.type === 'text') {
            // split text element contents according to USFM detection
            const segments = locateReferences(domNode.data);
            const elements = segments.map((segment, index) => {
                if (segment.usfm) {
                    return (
                        <BibleReference key={index} text={segment.text} usfm={segment.usfm} currentBook={currentBook} translation={translation} loadPassage={loadPassage} />
                    );
                }
                return (
                    segment.text
                );
            });
            return <>{elements}</>;
        }
    };

    return actualHTMLContents ? (<>
        {parse(actualHTMLContents, { replace: transform })}
    </>) : null;
}

export default ReadOnlyHTMLRenderer;
