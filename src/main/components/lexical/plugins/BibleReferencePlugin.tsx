import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, NodeKey, TextNode, LexicalNode, $isParagraphNode, $isTextNode, Spread, SerializedLexicalNode, TextModeType } from 'lexical';

import { locateReferences } from '../../../utils/bibleReferences';
import { BibleReference } from '../../scripture/Footnote';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

export class BibleReferenceNode extends TextNode {

    __usfm: any;

    static getType() {
        return 'bible-reference';
    }

    static clone(node: BibleReferenceNode) {
        return new BibleReferenceNode(node.__usfm, node.__key);
    }

    constructor(text: string, usfm: any, key?: NodeKey) {
        super(text, key);

        console.log('BibleReferenceNode', text, usfm);
        this.__usfm = usfm;
    }

    createDOM(config: any) {

        const element = document.createElement('span');
        // Set up any necessary DOM properties here
        element.style.color = 'pink'; // Example: apply direct styles if needed

        // Mount the React component into the element
        render(
            // TODO: (BIBLE-98) pass the necessary props to the component
            <BibleReference
                text={this.__text}
                usfm={this.__usfm}
                currentBook='GEN'
                translation='NKJV'
                loadPassage={() => {}}
            />,
            element
        );
        // element.innerText = this.__usfm.book + ' ' + this.__usfm.initialChapter + ':' + this.__usfm.initialVerse;

        return element;
    }

    updateDOM(prevNode: LexicalNode, dom: HTMLElement): boolean {
        return true;
    }

    removeDOM(dom: HTMLElement) {
        unmountComponentAtNode(dom);
    }

    static importJSON(serializedNode: SerializedBibleReferenceNode): BibleReferenceNode {
        return new BibleReferenceNode(serializedNode.text, serializedNode.usfm);
    }

    exportJSON(): SerializedBibleReferenceNode {
        return {
            ...super.exportJSON(),
            type: 'bible-reference',
            usfm: this.__usfm,
        };
    }
}

export type SerializedBibleReferenceNode = Spread<{
    detail: number;
    format: number;
    mode: TextModeType;
    style: string;
    text: string;

    usfm: any;
}, SerializedLexicalNode>;

function transformTextToBibleReference(node: TextNode): void {

    if (!node.isSimpleText()) {
        return;
    }

    const textContent = node.getTextContent();

    // Find only 1st occurrence as transform will be re-run anyway for the rest
    // because newly inserted nodes are considered to be dirty
    const references = locateReferences(textContent);
    if (references.length < 1) {
        return;
    }

    const reference = references.find((ref) => ref.usfm);
    if (!reference) {
        return;
    }

    // split the nodes, so that the reference is isolated
    let targetNode;
    if (reference.start === 0) {
        // | John 3:16 says | --> | John 3:16 | says |
        [targetNode] = node.splitText(reference.end);
    }
    else {
        // | in John 3:16 it says | --> | in | John 3:16 | it says |
        [, targetNode] = node.splitText(reference.start, reference.end);
    }

    // replace the reference with the new node
    console.log(reference.usfm);
    const bibleRefNode = new BibleReferenceNode(reference.text, reference.usfm);
    targetNode.replace(bibleRefNode);
}

function transformBibleReferenceToText(node: BibleReferenceNode): void {
    // TODO: (BIBLE-98) implement this
}

function BibleReferencePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (!editor.hasNodes([BibleReferenceNode])) {
            throw new Error('BibleReferencePlugin: BibleReferenceNode not registered on editor.');
        }

        return editor.registerUpdateListener(({ editorState }) => {

            editorState.read(() => {
                const root = $getRoot();

                root.getChildren().forEach((child: LexicalNode) => {
                    if ($isParagraphNode(child)) {
                        child.getChildren().forEach((innerChild: LexicalNode) => {
                            if ($isTextNode(innerChild)) {
                                editor.update(() => {
                                    transformTextToBibleReference(innerChild as TextNode);
                                });
                            }
                        });
                    }
                });

            });
        });
    }, [editor]);

    return null;
}

export default BibleReferencePlugin;
