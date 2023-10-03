import React from 'react';

import Accordion from 'react-bootstrap/Accordion';
import { WindowTypes } from '../utils/enums';

import '../styles/sidepanel.scss'

import manifest from '../../../public/manifest.json';

type SidepanelProps = {
    panelType?: symbol;
    createNewTab: (panelType: symbol, data: string) => void;
}

function Sidepanel({ panelType, createNewTab }: SidepanelProps): JSX.Element | null {

    let contents: JSX.Element | null = null;

    if (panelType === undefined) {
        return null;
    }

    const navStructure = manifest.map((bookData, count) => {

        const title = bookData['full-title'] ? bookData['full-title'] : bookData['title'];
        const key = String(count);

        return (
            <Accordion.Item key={key} eventKey={key}>
                <Accordion.Header>{title}</Accordion.Header>
                <Accordion.Body>
                    <ul className='list-unstyled'>
                        {bookData.chapters.map((verseCount, index) => {
                            return (
                                <li key={index} onClick={() => createNewTab(WindowTypes.Scripture.Type, `${bookData['usfm']}.${index + 1}`)}>{index + 1}</li>
                            );
                        })}
                    </ul>
                </Accordion.Body>
            </Accordion.Item>
        );
    });

    contents = (() => { //TODO: this is horrible, fix it
        switch (panelType) {
            case WindowTypes.Scripture.Type:
                return <>
                    <button onClick={() => createNewTab(panelType, WindowTypes.Scripture.Name)}>new</button>
                    <Accordion>
                        {navStructure}
                    </Accordion>
                </>;

            case WindowTypes.Document.Type:
                return <>
                    <button onClick={() => createNewTab(panelType, WindowTypes.Document.Name)}>new</button>
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