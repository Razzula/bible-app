import React from 'react';
import { Store, Sidenote, InlineAnchor, AnchorBase } from 'sidenotes';
import { deselectSidenote } from 'sidenotes/dist/src/store/ui/actions';
import { useStore } from 'react-redux';

import 'sidenotes/dist/sidenotes.css';
import '../styles/sidenotes.scss';
import '../styles/bible.scss'

var store: Store;

const docId = 'article';
const baseAnchor = 'anchor';
const blue = 'blue';
const red = 'red';

type App = {
    title: string
}

var test = {
    "1": {
        "1":{ "type":"text", "content":"In the " },
        "2":{ "type":"note", "content":"Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },
        "3":{ "type":"text",  "content":"beginning " },
        "4":{ "type":"note", "content":"Gen. 2:4; (Ps. 8:3; 89:11; 90:2); Is. 44:24; Acts 17:24; Rom. 1:20; (Heb. 1:2; 11:3); Rev. 4:1" },
        "5":{ "type":"text", "content":"God created the heavens and the earth." },
    },
    "2": {
        "1":{ "type":"text", "content":"The earth was " },
        "2":{ "type":"note", "content":"Jer. 4:23" },
        "3":{ "type":"text", "content":"without form, and void; and darkness " },
        "4":{ "type":"italics", "content":"was " },
        "5":{ "type":"text", "content":"on the face of the deep. " },
        "6":{ "type":"note", "content":"(Gen. 6:3); Job 26:13; Ps. 33:6; 104:30; Is. 40:13, 14" },
        "7":{ "type":"text", "content":"And the Spirit of God was hovering over the face of the waters." }    
    }
};

function App({ title }: App) {

    store = useStore();
    const deselect = () => store.dispatch(deselectSidenote(docId));

    return (
        <>
            <article id={docId} onClick={deselect}>
                <h1>Genesis 1</h1>

                <AnchorBase anchor={baseAnchor} className="base">

                    {/* TODO autofill from JSON */}
                    <div className="p">
                        <span className="label prime">1</span>
                        {test[1][1].content}
                        <span className="note"><span className=" body">
                            {test[1][2].content}
                        </span></span>
                        <InlineAnchor sidenote={blue}>
                            {test[1][3].content}
                        </InlineAnchor>
                        <span className="note"><span className=" body">
                            {test[1][4].content}
                        </span></span>
                        {test[1][5].content}

                        <span className="label">2</span>
                        {test[2][1].content}
                        <span className="note"><span className=" body">
                            {test[2][2].content}
                        </span></span>
                        {test[2][3].content}
                        <span className='it'>
                            {test[2][4].content}
                        </span>
                        {test[2][5].content}
                        <span className="note"><span className=" body">
                            {test[2][6].content}
                        </span></span>
                        <InlineAnchor sidenote={red}>
                            {test[2][7].content}
                        </InlineAnchor>
                    </div>

                </AnchorBase>

                <p className="notice">Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.</p>

                <div className="sidenotes">
                    <Sidenote sidenote={blue} base={baseAnchor}>
                        <div style={{ width: 280, height: 150}}>
                            <textarea>Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia, molestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum numquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium optio, eaque rerum! Provident similique accusantium nemo autem.</textarea>
                        </div>
                    </Sidenote>
                    <Sidenote sidenote={red} base={baseAnchor}>
                        <div style={{ width: 280, height: 100}}>right-hand note</div>
                    </Sidenote>
                </div>

                <div className="sidenotes l">
                    <Sidenote sidenote={blue} base={baseAnchor}>
                        <div style={{ width: 280, height: 100}}>left-hand note</div>
                    </Sidenote>
                </div>

            </article>
        </>
    );
}

export default App;