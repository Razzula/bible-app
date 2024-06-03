import React, { useEffect, useState } from 'react';

import FileManager from '../utils/FileManager';
import ReadOnlyHTMLRenderer from './common/ReadOnlyHTMLRenderer';
import licenses from '../../../public/licenses.json';
import { WindowTypes } from '../utils/enums';

import '../styles/resource.scss'
import { getReferenceText, getUSFM } from '../utils/bibleReferences';

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
    const [htmlContents, setHtmlContents] = useState('');
    const [childrenDocuments, setChildrenDocuments] = useState<JSX.Element[] | null>(null);

    const fileManager = FileManager.getInstance();

    const navTreeElement = navTreeArray.map((element, index) => {
        if (index < navTreeArray.length - 1) {
            return (<>
                <span className='chapter-button' onClick={() => travelToNavTreeNode(index)}>{element.title}</span>
                <span> {'>'} </span>
            </>);
        }
        return (<span>{element.title}</span>);
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
                console.log(currentManifest);
                console.log(resourcePath);

                if (currentManifest.landing) {
                    const htmlContents = await fileManager.loadResource(resourcePath, currentManifest.landing);
                    setHtmlContents(htmlContents);
                }

                if (currentManifest.children) {
                    const childrenDocuments = await fileManager.getResourceChildren(resourcePath, currentManifest.children);
                    setChildrenDocuments(childrenDocuments.map((child: any) => {

                        if (currentManifest.usfm) {
                            if (currentManifest.children === 'usfm-chapter') {
                                const usfm = getUSFM(child.path);
                                if (usfm) {
                                    child.title = usfm[0]?.initialChapter ;
                                }
                            }
                        }

                        return (
                            <div key={child.title ?? child.path}>
                                <span className='chapter-button' onClick={() => travelDownNavTree(child)}>{child.title}</span>
                            </div>
                        );
                    }));
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
        createNewTab(WindowTypes.Scripture.Type, getReferenceText(usfm));
    }

    async function travelDownNavTree(child: any) {
        if (resourcePath) {
            const newResourcePath = resourcePath + '/' + child.path;
            let newCurrentManifest: any = {};
            if (currentManifest && currentManifest.children !== 'dir') {
                // this is a leaf node, so we manage the resource directly
                // load file directly
                const htmlContents = await fileManager.loadResource(newResourcePath, '');
                setHtmlContents(htmlContents);
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
                        <center>
                            <h3>TABLE OF CONTENTS</h3>
                        </center>
                        {childrenDocuments}
                    </div>
                : null}
                <div className='resource-content'>
                    {/* RESOURCE DISPLAY */}
                    <ReadOnlyHTMLRenderer actualHTMLContents={htmlContents} currentBook={currentBook ?? ''} translation='NKJV' loadPassage={loadPassage} />
                </div>
                <p className="notice">{licenses.PUBLIC_DOMAIN}</p>
            </div>
        </div>
    );
}

export default Resource;