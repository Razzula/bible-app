import React, { useState } from 'react';

type SidenoteContent = {
    initialNoteContents: string;
}

function SidenoteContent({initialNoteContents}: SidenoteContent) {
    const [noteContents, setNoteContents] = useState(initialNoteContents);

    function handleChange(event: React.ChangeEvent<any>) {
        setNoteContents(event.currentTarget.value);
    }
    
    return (
        <div style={{ width: 280, height: 150}}>
            <textarea value={noteContents} onChange={handleChange} />
        </div>
    );

}

export default SidenoteContent;