import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, NodeKey, TextNode, LexicalNode, $isParagraphNode, $isTextNode, Spread, SerializedLexicalNode, TextModeType } from 'lexical';

import { locateReferences } from '../../../utils/bibleReferences';
import { BibleReference } from '../../scripture/Footnote';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Passage from '../../scripture/Passage';
import FileManager from '../../../utils/FileManager';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import rootReducer from '../../../redux/rootReducer';
import thunkMiddleware from 'redux-thunk';

type BibleReferencePluginProps = {
    translation: string;
    loadPassage: any;
}

type PopupData = {
    element: HTMLElement;
    text: string;
    usfm: any;
    translation: string;
    loadPassage: any;
}

export class BibleReferenceNode extends TextNode {
    __usfm: any;
    __translation: string;
    __loadPassage: any;
    __handleClick: ((event: MouseEvent, referenceData: any) => void) | null;

    static getType() {
        return 'bible-reference';
    }

    static clone(node: BibleReferenceNode) {
        return new BibleReferenceNode(node.__text, node.__usfm, node.__translation, node.__loadPassage, node.__handleClick, node.__key);
    }

    constructor(text: string, usfm: any, translation: string, loadPassage: any, handleClick: ((event: MouseEvent, referenceData: any) => void) | null, key?: NodeKey) {
        super(text, key);
        this.__usfm = usfm;
        this.__translation = translation;
        this.__loadPassage = loadPassage;
        this.__handleClick = handleClick;
    }

    createDOM(config: any) {
        const element = document.createElement('span');
        element.style.color = this.__usfm.book === config.namespace ? '#ff3344' : '#9900FF';
        element.style.cursor = 'pointer';
        element.innerText = this.__text;

        element.addEventListener('click', this.handleClick);

        return element;
    }

    handleClick = (event: MouseEvent) => {
        if (this.__handleClick) {
            this.__handleClick(event, {
                text: this.__text,
                usfm: this.__usfm,
                translation: this.__translation,
                loadPassage: this.__loadPassage,
            });
        }
    };

    setHandleClick(handleClick: (event: MouseEvent, referenceData: any) => void) {
        this.__handleClick = handleClick;
    }

    updateDOM(prevNode: LexicalNode, dom: HTMLElement): boolean {
        return true;
    }

    static importJSON(serializedNode: SerializedBibleReferenceNode): BibleReferenceNode {
        return new BibleReferenceNode(serializedNode.text, serializedNode.usfm, '', null, null);
    }

    exportJSON(): SerializedBibleReferenceNode {
        return {
            ...super.exportJSON(),
            type: 'bible-reference',
            usfm: this.__usfm,
        };
    }
}

function FloatingBibleReferenceViewer({ text, usfm, translation, loadPassage }: any) {

    const [passageContents, setPassageContents]: [string | undefined, Function] = useState();
    const fileManager = FileManager.getInstance();

    useEffect(() => {
        const fetchData = async () => {
            const passageContents = await fileManager.loadScripture(usfm.book, usfm.initialChapter, translation);

            if (!passageContents) {
                setPassageContents(null);
                return;
            }

            // trim to specific verses
            let initalVerse = 1, finalVerse = passageContents.length

            if (usfm.initialVerse) {
                initalVerse = usfm.initialVerse;

                if (usfm.finalVerse) {
                    finalVerse = usfm.finalVerse;
                }
                else {
                    finalVerse = initalVerse;
                }
            }

            const slicedPassageContents: any = {};
            for (let i = initalVerse; i <= finalVerse; i++) {
                slicedPassageContents[i] = passageContents[i];
            }
            slicedPassageContents[initalVerse][0].verse = initalVerse;

            setPassageContents([slicedPassageContents]);
        };
        fetchData();

    }, [usfm, translation]);

    return (
        <Provider store={createStore(rootReducer, applyMiddleware(thunkMiddleware))}>
            <Passage contents={passageContents} usfm={usfm} ignoreFootnotes translation={translation} />
        </Provider>
    );
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
    const [popupData, setPopupData] = useState<PopupData | null>(null);

    useEffect(() => {
        if (!editor.hasNodes([BibleReferenceNode])) {
            throw new Error('BibleReferencePlugin: BibleReferenceNode not registered on editor.');
        }

        editor.registerNodeTransform(BibleReferenceNode, (node) => {
            if (node instanceof BibleReferenceNode) {
                node.setHandleClick(handleReferenceClick);
            }
        });

        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const root = $getRoot();
                root.getChildren().forEach((child) => {
                    if ($isParagraphNode(child)) {
                        child.getChildren().forEach((innerChild) => {
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

    useEffect(() => {
        if (popupData) {
            const { element, text, usfm, translation, loadPassage } = popupData;
            const rect = element.getBoundingClientRect();
            const popup = document.createElement('div');
            popup.style.position = 'absolute';
            popup.style.top = `${rect.bottom}px`;
            popup.style.left = `${rect.left}px`;
            document.body.appendChild(popup);

            const root = createRoot(popup);
            root.render(
                <FloatingBibleReferenceViewer
                    text={text}
                    usfm={usfm}
                    translation={translation}
                    loadPassage={loadPassage}
                />
            );

            return () => {
                root.unmount();
                document.body.removeChild(popup);
            };
        }
    }, [popupData]);

    function handleReferenceClick(event: MouseEvent, referenceData: any) {
        setPopupData({
            ...referenceData,
            element: event.target as HTMLElement,
        });
    }

    function transformTextToBibleReference(node: TextNode, references: any[]): void {
        if (!node.isSimpleText() || references.length < 1) {
            return;
        }
        const reference = references.find((ref) => ref.usfm);
        if (!reference) {
            return;
        }

        let targetNode;
        if (reference.start === 0) {
            [targetNode] = node.splitText(reference.end);
        } else {
            [, targetNode] = node.splitText(reference.start, reference.end);
        }

        const bibleRefNode = new BibleReferenceNode(reference.text, reference.usfm, translation, loadPassage, handleReferenceClick);
        targetNode.replace(bibleRefNode);
    }

    return null;
}

export default BibleReferencePlugin;