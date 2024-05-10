import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, NodeKey, TextNode, LexicalNode, $isParagraphNode, $isTextNode, Spread, SerializedLexicalNode, TextModeType } from 'lexical';

import { locateReferences } from '../../../utils/bibleReferences';
import { BibleReference } from '../../scripture/Footnote';
import React from 'react';
import { createRoot } from 'react-dom/client';

type BibleReferencePluginProps = {
    translation: string;
    loadPassage: any;
}

export class BibleReferenceNode extends TextNode {

    __usfm: any;
    __translation: string;
    __loadPassage: any;

    static getType() {
        return 'bible-reference';
    }

    static clone(node: BibleReferenceNode) {
        return new BibleReferenceNode(node.__usfm, node.__translation, node.__loadPassage, node.__key);
    }

    constructor(text: string, usfm: any, translation: string, loadPassage: any, key?: NodeKey) {
        super(text, key);

        this.__text = text;
        this.__usfm = usfm;
        this.__translation = translation;
        this.__loadPassage = loadPassage;
    }

    createDOM(config: any) {

        const element = document.createElement('span');

        element.style.color = this.__usfm.book === config.namespace ? '#ff3344' : '#9900FF';
        element.style.cursor = 'pointer';
        element.innerText = this.__text;

        // TODO: (BIBLE-98) display popover with passage (similar to links)

        // const root = createRoot(element);
        // root.render(
        //     <BibleReference
        //         text={this.__text}
        //         usfm={this.__usfm}
        //         currentBook={this.__currentBook}
        //         translation={this.__translation}
        //         loadPassage={this.__loadPassage}
        //     />
        // );

        return element;
    }

    updateDOM(prevNode: LexicalNode, dom: HTMLElement): boolean {
        return true;
    }

    static importJSON(serializedNode: SerializedBibleReferenceNode): BibleReferenceNode {
        return new BibleReferenceNode(serializedNode.text, serializedNode.usfm, '', null);
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


function BibleReferencePlugin({ translation, loadPassage }: BibleReferencePluginProps) {
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
                                const textContent = innerChild.getTextContent();
                                const references = locateReferences(textContent);

                                if (references.length >= 1) {
                                    editor.update(() => {
                                        transformTextToBibleReference(innerChild as TextNode, references);
                                    });
                                }

                            }
                        });
                    }
                });

            });
        });
    }, [editor]);

    function transformTextToBibleReference(node: TextNode, references: any[]): void {

        if (!node.isSimpleText() || references.length < 1) {
            return;
        }
        // Find only 1st occurrence as transform will be re-run anyway for the rest
        // because newly inserted nodes are considered to be dirty
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
        const bibleRefNode = new BibleReferenceNode(reference.text, reference.usfm, translation, loadPassage);
        targetNode.replace(bibleRefNode);
    }

    function transformBibleReferenceToText(node: BibleReferenceNode): void {
        // TODO: (BIBLE-98) implement this
    }

    return null;
}

export default BibleReferencePlugin;
