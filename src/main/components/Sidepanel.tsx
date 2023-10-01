import React from 'react';

import Accordion from 'react-bootstrap/Accordion';

import '../styles/sidepanel.scss'

import manifest from '../../../public/manifest.json';

type Sidepanel = {
    panelType?: string;
    createNewTab: Function;
}

function Sidepanel({panelType, createNewTab} : Sidepanel) {

    let contents: JSX.Element | null = null;

    if (panelType === undefined) {
        return null;
    }

    const navStructure = manifest.map((bookData, count) => {

        const title = bookData['full-title'] ? bookData['full-title'] : bookData['title'];

        return (
            <Accordion.Item eventKey={String(count)}>
                <Accordion.Header>{title}</Accordion.Header>
                <Accordion.Body>
                    <ul className='list-unstyled'>
                        {bookData.chapters.map((verseCount, index) => {
                            return (
                                <li onClick={() => createNewTab('scripture', `${bookData['usfm']}.${index + 1}`)}>{index + 1}</li>
                            );
                        })}
                    </ul>
                </Accordion.Body>
            </Accordion.Item>
        );
    });

    contents = <>
        <button onClick={() => createNewTab(panelType, `New ${panelType}`)}>new {panelType}</button>
        <Accordion>
            {panelType === 'scripture' ? navStructure : null}
        </Accordion>
    </>;

    return (
        <div className="sidepanel">
            {contents}
        </div>
    );

}

export default Sidepanel;