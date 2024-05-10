import { AutoLinkPlugin, createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin';
import * as React from 'react';

import { REFERENCE_REGEX2 } from '../../../utils/bibleReferences';

const MATCHERS = [
    createLinkMatcherWithRegExp(REFERENCE_REGEX2, (text) => {
        return 'https://www.google.com';
    }),
];

export default function LexicalAutoLinkPlugin(): JSX.Element {
    return <AutoLinkPlugin matchers={MATCHERS} />;
}
