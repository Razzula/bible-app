import React, { useEffect, useState } from 'react';

import FileManager from '../utils/FileManager';
import ReadOnlyHTMLRenderer from './common/ReadOnlyHTMLRenderer';
import licenses from '../../../public/licenses.json';
import { WindowTypes } from '../utils/enums';

import '../styles/resource.scss'
import { getReferenceText, getUSFM } from '../utils/bibleReferences';
import Passage from './scripture/Passage';
import { Alert } from 'react-bootstrap';

type ResourceProps = {
    rootResourcePath: string;
    resourceFileName: string;
    createNewTab: any;
}

/**
 * A React component to display ...
 * @returns {JSX.Element}
 */
function Resource({ rootResourcePath, createNewTab }: ResourceProps): JSX.Element {

    const [navTreeArray, setNavTreeArray] = useState<any[]>([]);

    const [currentBook, setCurrentBook] = useState<string | undefined>(undefined);
    const [resourceElement, setResourceElement] = useState<JSX.Element | JSX.Element[] | null>(null);
    const [childrenDocuments, setChildrenDocuments] = useState<JSX.Element[] | null>(null);

    const fileManager = FileManager.getInstance();

    const navTreeElement = navTreeArray.map((element, index) => {
        if (index < navTreeArray.length - 1) {
            return (<span key={index}>
                <span className='chapter-button' onClick={() => travelToNavTreeNode(index)}>{element.title}</span>
                <span> {'>'} </span>
            </span>);
        }
        return (<span key={index}>{element.title}</span>);
    });

    const rootManifest = navTreeArray[0];
    const currentManifest = navTreeArray[navTreeArray.length - 1];
    const resourcePath = navTreeArray?.map((element) => element.path).join('/');

    useEffect(() => {
        const loadRootManifest = async () => {
            const manifest = await fileManager.loadResource(rootResourcePath, 'manifest.json');
            if (manifest) {
                manifest.path = rootResourcePath;
                setNavTreeArray([manifest]);
            }
            else {
                console.error('Failed to load manifest for', rootResourcePath);
            }
        }
        loadRootManifest();
        // setResourcePath(rootResourcePath);
    }, [rootResourcePath]);

    useEffect(() => {
        const loadResource = async () => {
            if (currentManifest) {

                if (currentManifest.landing) {
                    const htmlContents = await fileManager.loadResource(resourcePath, currentManifest.landing);
                    setResourceElement(<ReadOnlyHTMLRenderer actualHTMLContents={htmlContents} currentBook={currentBook ?? ''} translation='WEBBE' loadPassage={loadPassage} />);
                }

                if (currentManifest.children) {
                    let childrenDocuments = await fileManager.getResourceChildren(resourcePath, currentManifest.children);

                    childrenDocuments = childrenDocuments.map((child: any) => {
                        if (currentManifest.usfm) {
                            if (currentManifest.children === 'usfm-chapter') {
                                const usfm = getUSFM(child.path, null, NaN, true);
                                if (usfm) {
                                    child.title = usfm[0]?.initialChapter;
                                }
                            }
                        }

                        return (
                            <div key={child.title ?? child.path}>
                                <span className='chapter-button' onClick={() => travelDownNavTree(child)}>{child.title}</span>
                            </div>
                        );
                    });

                    if (currentManifest.children === 'usfm-chapter') {
                        // children are ordered alphabetically by default, so we need to sort them numerically
                        childrenDocuments = childrenDocuments.sort((a: any, b: any) => Number(a.key) - Number(b.key));
                    }

                    setChildrenDocuments(childrenDocuments);
                }
            }

            if (currentManifest.usfm) {
                setCurrentBook(currentManifest.usfm);
            }
        }
        if (currentManifest) {
            loadResource();
        }
    }, [currentManifest]);

    function loadPassage(usfm: any, isFootnote: boolean, openInNewTab: boolean) {
        createNewTab(WindowTypes.Scripture, getReferenceText(usfm));
    }

    async function travelDownNavTree(child: any) {
        if (resourcePath) {
            const newResourcePath = resourcePath + '/' + child.path;
            let newCurrentManifest: any = {};
            if (currentManifest && currentManifest.children !== 'dir') {
                // this is a leaf node, so we manage the resource directly
                // load file directly
                const fileContents = await fileManager.loadResource(newResourcePath, '');

                if (typeof fileContents === 'string') {
                    // HTML
                    setResourceElement(
                        <ReadOnlyHTMLRenderer actualHTMLContents={fileContents} currentBook={currentManifest.usfm ?? currentBook ?? ''} translation='WEBBE' loadPassage={loadPassage} />
                    );
                }
                else {
                    // JSON
                    if (currentManifest.format && currentManifest.format === 'passage' && currentManifest.usfm) {
                        // render as a passage
                        const disclaimer = fileContents.disclaimer ?? null;
                        const elements: JSX.Element[] = [];

                        elements.push(
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5em', letterSpacing: 10 }}>
                                    <b>{currentManifest.title.toUpperCase()}</b>
                                </div>
                                <div style={{ fontSize: '1.5em' }}>
                                    CHAPTER {child.title}.
                                </div>
                                <hr style={{ width: 50, marginLeft: 'auto', marginRight: 'auto' }} />
                            </div>
                        );
                        if (disclaimer) {
                            elements.push(
                                <Alert variant='warning' style={{ textAlign: 'center' }}>
                                    <ReadOnlyHTMLRenderer
                                        actualHTMLContents={disclaimer}
                                        currentBook={currentBook ?? currentManifest.usfm}
                                        translation='WEBBE' loadPassage={loadPassage}
                                    />
                                </Alert>
                            );
                            delete fileContents.disclaimer;
                        }
                        elements.push(
                            <div className='passage'>
                                <Passage
                                    contents={[fileContents]}
                                    usfm={{book: currentManifest.usfm, initialChapter: 0}}
                                    translation='WEBBE'
                                    ignoreFootnotes={true}
                                />
                            </div>
                        );

                        setResourceElement(elements);
                    }
                    else {
                        // render as plain text
                        // TODO
                        console.error('Non-passage JSON formats not yet implemented.');
                    }
                }
                // a leaf node has no children
                setChildrenDocuments(null);

                newCurrentManifest.title = child.title;
            }
            else {
                newCurrentManifest = await fileManager.loadResource(newResourcePath, 'manifest.json');
            }
            newCurrentManifest.path = child.path;
            setNavTreeArray([...navTreeArray, newCurrentManifest])
        }
    }

    function travelToNavTreeNode(index: number) {
        setNavTreeArray(navTreeArray.slice(0, index + 1));
    }

    // GENERATE JSX
    return (
        <div className='resource'>

            <div className='resource-header'>
                <div className='anchor-left'>
                    <span>{navTreeElement}</span>
                </div>
                <div className='anchor-right'>
                    {rootManifest?.author} <i>({rootManifest?.year})</i>
                </div>
            </div>

            <div className='scroll'>
                {childrenDocuments ?
                    <div className='resource-content'>
                        {/* NAVIGATION PANE */}
                        <div style={{ textAlign: 'center' }}>
                            <h3>TABLE OF CONTENTS</h3>
                        </div>
                        {childrenDocuments}
                    </div>
                : null}
                <div className='resource-content' style={ navTreeArray[navTreeArray.length - 2]?.format === 'passage' ? { maxWidth: '900px' } : {}}>
                    {/* RESOURCE DISPLAY */}
                    {currentManifest ? resourceElement : 'LOADING...'}
                </div>
                <p className="notice">{licenses.PUBLIC_DOMAIN}</p>
            </div>
        </div>
    );
}

export default Resource;