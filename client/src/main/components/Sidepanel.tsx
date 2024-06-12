import React, { useEffect } from 'react';
import Accordion from 'react-bootstrap/Accordion';

import manifest from '../../../public/manifest.json';
import { WindowTypes } from '../utils/enums';

import '../styles/sidepanel.scss';
import FileManager from '../utils/FileManager';
import { use } from 'chai';

type SidepanelProps = {
    panelType?: symbol;
    createNewTab: (panelType: symbol, data: string, hidePanel?: boolean) => void;
}

function Sidepanel({ panelType, createNewTab }: SidepanelProps): JSX.Element | null {

    const [availableResources, setAvailableResources] = React.useState<any[]>([]);

    let contents: JSX.Element | JSX.Element[] | null = null;

    useEffect(() => {
        const fileManager = FileManager.getInstance();
        fileManager.getDirectories('resources').then((dirs) => {
            setAvailableResources(dirs);
        });
    }, []);

    if (panelType === undefined) {
        return null;
    }

    function handleCreateNewTab(event: React.MouseEvent, panelType: symbol, data: string): void {

        switch (event.button) {
            case 0:
                createNewTab(panelType, data, true);
                break
            case 1:
                event.preventDefault();
                createNewTab(panelType, data, false);
                break;
            default:
                break;
        }
    }

    const navStructure = manifest.map((bookData, count) => {

        const title = bookData['full-title'] ? bookData['full-title'] : bookData['title'];
        const key = String(count);

        return (
            <Accordion.Item key={key} eventKey={key}>
                <Accordion.Header>{title}</Accordion.Header>
                <Accordion.Body>
                    <div className='chapters-grid'>
                        {bookData.chapters.map((verseCount, index) => {
                            return (
                                <span className='chapter-button' key={index} onMouseDown={(event) => handleCreateNewTab(event, WindowTypes.Scripture.Type, `${bookData['usfm']}.${index + 1}`)}>{index + 1}</span>
                            );
                        })}
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        );
    });

    contents = (() => { //TODO: (BIBLE-64) this is horrible, fix it
        switch (panelType) {
            case WindowTypes.Scripture.Type:
                return <>
                    <button onClick={(event) => handleCreateNewTab(event, panelType, WindowTypes.Scripture.Name)}>new</button>
                    <Accordion>
                        {navStructure}
                    </Accordion>
                </>;

            case WindowTypes.Resource.Type:
                return availableResources.map((resource, index) => {
                    return (
                        <div
                            key={index}
                            className='chapter-button'
                            onMouseDown={(event) => handleCreateNewTab(event, panelType, resource.path)}
                        >
                            {resource.title}
                        </div>
                    );
                });

            case WindowTypes.Document.Type:
                return <>
                    <button onClick={(event) => handleCreateNewTab(event, panelType, WindowTypes.Document.Name)}>new</button>
                </>;

            default:
                return null;
        }
    })();

    return (
        <div className="sidepanel">
            {contents}
        </div>
    );

}

export default Sidepanel;