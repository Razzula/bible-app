import React, { useState } from 'react';

type SidenoteContent = {
    id: string;
    initialNoteContents: string;
}

function SidenoteContent({id, initialNoteContents}: SidenoteContent) {
    const [temp, setId] = useState(id);
    const [noteContents, setNoteContents] = useState(initialNoteContents);

    function handleChange(event: React.ChangeEvent<any>) {
        setNoteContents(event.currentTarget.value);
    }

    if (id !== temp) {
        setId(id);
        setNoteContents(initialNoteContents);
    }

    return (
        <div style={{ width: 280, height: 150}}>
            <textarea value={noteContents} onChange={handleChange} />
        </div>
    );

}

export default SidenoteContent;