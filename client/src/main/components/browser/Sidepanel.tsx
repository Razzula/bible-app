import React, { useEffect } from 'react';
// import Accordion from 'react-bootstrap/Accordion';

import manifest from '../../../../public/manifest.json';
import { WindowTypes } from '../../utils/enums';

import '../../styles/sidepanel.scss';
import FileManager from '../../utils/FileManager';
import { Accordion, AccordionHeader, AccordionContent } from '../common/Accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '../common/Tooltip';
import { getReferenceText, getUSFM } from '../../utils/bibleReferences';
import ButtonGrid from '../common/ButtonGrid';

type SidepanelProps = {
    panelType?: any;
    createNewTab: (panelType: any, data: string, hidePanel?: boolean) => void;
    deselectButton: Function;
}

function Sidepanel({ panelType, createNewTab, deselectButton }: SidepanelProps): JSX.Element | null {

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
                deselectButton();
                break
            case 1:
                event.preventDefault();
                createNewTab(panelType, data, false);
                break;
            default:
                break;
        }
    }

    function navStructure(windowType: any): JSX.Element[] {
        return manifest.map((bookData, count) => {

            const title = bookData['full-title'] ? bookData['full-title'] : bookData['title'];

            return (<>
                <AccordionHeader key={`${count}-header`} index={count}>{title}</AccordionHeader>
                <AccordionContent key={`${count}-body`} index={count}>
                    <ButtonGrid
                        key={`${count}-grid`}
                        gridData={bookData.chapters.map((chapter: any, index: number) => index + 1)}
                        handleClick={(event, data) => handleCreateNewTab(event, windowType, getReferenceText(getUSFM(`${bookData['usfm']}.${data}`)))}
                    />
                </AccordionContent>
            </>);
        });
    }

    contents = (() => { //TODO: (BIBLE-64) this is horrible, fix it
        switch (panelType?.type) {
            case WindowTypes.Scripture.type:
                return <>
                    <Accordion>
                        {navStructure(WindowTypes.Scripture)}
                    </Accordion>
                </>;

            case WindowTypes.Interlinear.type:
                return <>
                    <Accordion>
                        {navStructure(WindowTypes.Interlinear)}
                    </Accordion>
                </>;

            case WindowTypes.Resource.type:
                return availableResources.map((resource, index) => {
                    let statePath, stateText;
                    switch (resource.state) {
                        case 'local':
                            statePath = '/bible-app/icons/downloaded.svg';
                            stateText='Available Offline';
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
                            key={resource?.path}
                        >
                            <span className='flex-left'>
                                {resource.title}
                            </span>
                            <span className='anchor-right'>
                                <Tooltip placement='right-start'>
                                        <TooltipTrigger><img src='/bible-app/icons/info.svg' alt='Info Icon'/></TooltipTrigger>
                                        <TooltipContent>
                                            <div><b>{resource?.title}</b></div>
                                            <div>{resource?.author}</div>
                                            <div>{resource?.year}</div>
                                        </TooltipContent>
                                </Tooltip>
                                <Tooltip placement='right-start'>
                                    <TooltipTrigger><img src={statePath} alt={stateText}/></TooltipTrigger>
                                    <TooltipContent>{stateText}</TooltipContent>
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