import React, { useEffect } from 'react';
import Accordion from 'react-bootstrap/Accordion';

import manifest from '../../../public/manifest.json';
import { WindowTypes } from '../utils/enums';

import '../styles/sidepanel.scss';
import FileManager from '../utils/FileManager';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip';

type SidepanelProps = {
    panelType?: any;
    createNewTab: (panelType: any, data: string, hidePanel?: boolean) => void;
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

    function handleCreateNewTab(event: React.MouseEvent, panelType: any, data: string): void {

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
                                <span className='chapter-button' key={index} onMouseDown={(event) => handleCreateNewTab(event, WindowTypes.Scripture, `${bookData['usfm']}.${index + 1}`)}>{index + 1}</span>
                            );
                        })}
                    </div>
                </Accordion.Body>
            </Accordion.Item>
        );
    });

    contents = (() => { //TODO: (BIBLE-64) this is horrible, fix it
        switch (panelType?.type) {
            case WindowTypes.Scripture.type:
                return <>
                    <button onClick={(event) => handleCreateNewTab(event, panelType, WindowTypes.Scripture.name)}>new</button>
                    <Accordion>
                        {navStructure}
                    </Accordion>
                </>;

            case WindowTypes.Resource.type:
                return availableResources.map((resource, index) => {
                    let statePath, stateText;
                    switch (resource.state) {
                        case 'local':
                            statePath = '/bible-app/icons/downloaded.svg';
                            stateText='Downloaded';
                            break;
                        case 'demo':
                            statePath = '/bible-app/icons/notDownloaded.svg';
                            stateText='Partially Available (Demo)';
                            break;
                        case 'cloud':
                        default:
                            statePath = '/bible-app/icons/cloud.svg';
                            stateText='Available Online';
                            break;
                    }

                    return (
                        <div
                            className='select-option'
                            onMouseDown={(event) => handleCreateNewTab(event, panelType, resource.path)}
                        >
                            <span className='flex-left'>
                                <Tooltip placement='bottom'>
                                    <TooltipTrigger><img src={statePath} alt={stateText}/></TooltipTrigger>
                                    <TooltipContent>{stateText}</TooltipContent>
                                </Tooltip>
                                {resource.title}
                            </span>
                            <span className='flex-right'>
                                <Tooltip placement='right-start'>
                                        <TooltipTrigger><img src='/bible-app/icons/info.svg' alt='Info Icon' className='flex-right'/></TooltipTrigger>
                                        <TooltipContent>
                                            <div><b>{resource?.title}</b></div>
                                            <div>{resource?.author}</div>
                                            <div>{resource?.year}</div>
                                        </TooltipContent>
                                </Tooltip>
                            </span>
                        </div>
                    );
                });

            case WindowTypes.Document.type:
                return <>
                    <button onClick={(event) => handleCreateNewTab(event, panelType, WindowTypes.Document.name)}>new</button>
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