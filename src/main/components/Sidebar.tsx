import React from 'react';
import { Nav } from 'react-bootstrap';

function Sidebar() {

    return (
        <div className="sidebar">
            <Nav defaultActiveKey="/home" className="flex-column">
                {/* <Nav.Link href="/home">H</Nav.Link>
                <Nav.Link href="/about">A</Nav.Link>
                <Nav.Link href="/services">S</Nav.Link> */}
            </Nav>
        </div>
    );

}

export default Sidebar;