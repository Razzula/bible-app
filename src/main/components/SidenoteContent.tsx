import React, { useState } from 'react';

type SidenoteContent = {
    id: string;
    initialNoteContents: string;
}

/**
 * A React component to display and edit the contents of a sidenote.
 *
 * @param {SidenoteContentProps} props - The properties passed to the component.
 *   - id (string): The unique identifier of the sidenote.
 *   - initialNoteContents (string): The initial contents of the sidenote.
 *
 * @returns {JSX.Element} A JSX Element of a `div` containing the sidenote.
 */
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