import React, { useEffect, useState } from 'react';

import FileManager from '../utils/FileManager';
import ReadOnlyHTMLRenderer from './common/ReadOnlyHTMLRenderer';
import licenses from '../../../public/licenses.json';
import { WindowTypes } from '../utils/enums';

import '../styles/resource.scss'
import { getReferenceText } from '../utils/bibleReferences';
import { use } from 'chai';

type ResourceProps = {
    resourcePath: string;
    resourceFileName: string;
    createNewTab: any;
}

/**
 * A React component to display ...
 * @returns {JSX.Element}
 */
function Resource({ resourcePath, createNewTab }: ResourceProps): JSX.Element {

    const [rootManifest, setRootManifest] = useState<any>(null);
    const [currentManifest, setCurrentManifest] = useState<any>(null);
    const [htmlContents, setHtmlContents] = useState('');
    const [childrenDocuments, setChildrenDocuments] = useState<JSX.Element[] | null>(null);

    const fileManager = FileManager.getInstance();

    useEffect(() => {
        const loadRootManifest = async () => {
            const manifest = await fileManager.loadResource(resourcePath, 'manifest.json');
            if (manifest) {
                setRootManifest(manifest);
            }
            else {
                console.error('Failed to load manifest for', resourcePath);
            }
        }
        loadRootManifest();
    }, []);

    useEffect(() => {
        const loadResource = async () => {

            const currentManifest = await fileManager.loadResource(resourcePath, 'manifest.json');
            setCurrentManifest(currentManifest);
        }
        loadResource();
    }, [resourcePath]);

    useEffect(() => {
        const loadResource = async () => {
            if (currentManifest) {

                if (currentManifest.landing) {
                    const htmlContents = await fileManager.loadResource(resourcePath, currentManifest.landing);
                    setHtmlContents(htmlContents);
                }

                if (currentManifest.children) {
                    const childrenDocuments = await fileManager.getResourceChildren(resourcePath, currentManifest.children);
                    console.log(childrenDocuments);
                    setChildrenDocuments(childrenDocuments.map((child: any) => {
                        return (
                            <div key={child.title}>
                                <a onClick={() => {/* TODO: navigate here */}}>{child.title}</a>
                            </div>
                        );
                    }));
                }
            }
        }
        if (currentManifest) {
            loadResource();
        }
    }, [currentManifest]);

    function loadPassage(usfm: any, isFootnote: boolean, openInNewTab: boolean) {
        createNewTab(WindowTypes.Scripture.Type, getReferenceText(usfm));
    }

    // GENERATE JSX
    return (
        <div className='resource'>
            <span>{resourcePath}</span> {/* TODO: display a navigable title structure */}
            <div className='scroll'>
                <center>
                    <h4>{rootManifest?.title}</h4>
                </center>
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
                    <ReadOnlyHTMLRenderer actualHTMLContents={htmlContents} currentBook='' translation='NKJV' loadPassage={loadPassage} />
                </div>
                <p className="notice">{licenses.PUBLIC_DOMAIN}</p>
            </div>
        </div>
    );
}

export default Resource;