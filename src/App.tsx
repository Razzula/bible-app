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

var test = [[{ "type": "p", "content": "In the " },{ "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },{ "type": "text", "content": "beginning " },{ "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },{ "type": "text", "content": "God created the heavens and the earth. " }],[{ "type": "text", "content": "The earth was " },{ "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },{ "type": "text", "content": "without form, and void; and darkness " },{ "type": "it", "content": "was" },{ "type": "text", "content": " on the face of the deep. " },{ "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },{ "type": "text", "content": "And the Spirit of God was hovering over the face of the waters." }],[{ "type": "p", "content": "" },{ "type": "note", "content": "Ps. 33:6, 9" },{ "type": "text", "content": "Then God said, " },{ "type": "note", "content": "Ps. 33:6, 9" },{ "type": "text", "content": "\"Let there be " },{ "type": "note", "content": "Ps. 33:6, 9" },{ "type": "text", "content": "light\"; and there was light. " }],[{ "type": "text", "content": "And God saw the light, that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good; and God divided the light from the darkness. " }],[{ "type": "text", "content": "God called the light Day, and the " },{ "type": "note", "content": "Ps. 33:6, 9" },{ "type": "text", "content": "darkness He called Night. So the evening and the morning were the first day." }],[{ "type": "p", "content": "Then God said, " },{ "type": "note", "content": "Job 37:18; Jer. 10:12; 2 Pet. 3:5" },{ "type": "text", "content": "\"Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.\" " }],[{ "type": "text", "content": "Thus God made the firmament, " },{ "type": "note", "content": "Job 37:18; Jer. 10:12; 2 Pet. 3:5" },{ "type": "text", "content": "and divided the waters which " },{ "type": "it", "content": "were" },{ "type": "text", "content": " under the firmament from the waters which " },{ "type": "it", "content": "were" },{ "type": "text", "content": " " },{ "type": "note", "content": "Job 37:18; Jer. 10:12; 2 Pet. 3:5" },{ "type": "text", "content": "above the firmament; and it was so. " }],[{ "type": "text", "content": "And God called the firmament Heaven. So the evening and the morning were the second day." }],[{ "type": "p", "content": "Then God said, " },{ "type": "note", "content": "Job 26:10; Ps. 104:6-9; Prov. 8:29; Jer. 5:22; 2 Pet. 3:5" },{ "type": "text", "content": "\"Let the waters under the heavens be gathered together into one place, and " },{ "type": "note", "content": "Job 26:10; Ps. 104:6-9; Prov. 8:29; Jer. 5:22; 2 Pet. 3:5" },{ "type": "text", "content": "let the dry " },{ "type": "it", "content": "land" },{ "type": "text", "content": " appear\"; and it was so. " }],[{ "type": "text", "content": "And God called the dry " },{ "type": "it", "content": "land" },{ "type": "text", "content": " Earth, and the gathering together of the waters He called Seas. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good." }],[{ "type": "p", "content": "Then God said, \"Let the earth " },{ "type": "note", "content": "Ps. 65:9-13; 104:14; Heb. 6:7" },{ "type": "text", "content": "bring forth grass, the herb " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields seed, " },{ "type": "it", "content": "and" },{ "type": "text", "content": " the " },{ "type": "note", "content": "Ps. 65:9-13; 104:14; Heb. 6:7" },{ "type": "text", "content": "fruit tree " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields fruit according to its kind, whose seed " },{ "type": "it", "content": "is" },{ "type": "text", "content": " in itself, on the earth\"; and it was so. " }],[{ "type": "text", "content": "And the earth brought forth grass, the herb " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields seed according to its kind, and the tree " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields fruit, whose seed " },{ "type": "it", "content": "is" },{ "type": "text", "content": " in itself according to its kind. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good. " }],[{ "type": "text", "content": "So the evening and the morning were the third day." }],[{ "type": "p", "content": "Then God said, \"Let there be " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "lights in the firmament of the heavens to divide the day from the night; and let them be for signs and " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "seasons, and for days and years; " }],[{ "type": "text", "content": "and let them be for lights in the firmament of the heavens to give light on the earth\"; and it was so. " }],[{ "type": "text", "content": "Then God made two great lights: the " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "greater light to rule the day, and the " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "lesser light to rule the night. " },{ "type": "it", "content": "He made" },{ "type": "text", "content": " " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "the stars also. " }],[{ "type": "text", "content": "God set them in the firmament of the " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "heavens to give light on the earth, " }],[{ "type": "text", "content": "and to " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "rule over the day and over the night, and to divide the light from the darkness. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good. " }],[{ "type": "text", "content": "So the evening and the morning were the fourth day." }],[{ "type": "p", "content": "Then God said, \"Let the waters abound with an abundance of living creatures, and let birds fly above the earth across the face of the firmament of the heavens.\" " }],[{ "type": "text", "content": "So " },{ "type": "note", "content": "Ps. 104:25-28" },{ "type": "text", "content": "God created great sea creatures and every living thing that moves, with which the waters abounded, according to their kind, and every winged bird according to its kind. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good. " }],[{ "type": "text", "content": "And God blessed them, saying, " },{ "type": "note", "content": "Ps. 104:25-28" },{ "type": "text", "content": "\"Be fruitful and multiply, and fill the waters in the seas, and let birds multiply on the earth.\" " }],[{ "type": "text", "content": "So the evening and the morning were the fifth day." }],[{ "type": "p", "content": "Then God said, \"Let the earth bring forth the living creature according to its kind: cattle and creeping thing and beast of the earth, " },{ "type": "it", "content": "each" },{ "type": "text", "content": " according to its kind\"; and it was so. " }],[{ "type": "text", "content": "And God made the beast of the earth according to its kind, cattle according to its kind, and everything that creeps on the earth according to its kind. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good." }],[{ "type": "p", "content": "Then God said, " },{ "type": "note", "content": "Gen. 9:6; Ps. 100:3; Eccl. 7:29; (Eph. 4:24); James 3:9" },{ "type": "text", "content": "\"Let Us make man in Our image, according to Our likeness; " },{ "type": "note", "content": "Gen. 9:6; Ps. 100:3; Eccl. 7:29; (Eph. 4:24); James 3:9" },{ "type": "text", "content": "let them have dominion over the fish of the sea, over the birds of the air, and over the cattle, over all the earth and over every creeping thing that creeps on the earth.\" " }],[{ "type": "text", "content": "So God created man " },{ "type": "note", "content": "Gen. 9:6; Ps. 100:3; Eccl. 7:29; (Eph. 4:24); James 3:9" },{ "type": "text", "content": "in His " },{ "type": "it", "content": "own" },{ "type": "text", "content": " image; in the image of God He created him; " },{ "type": "note", "content": "Gen. 9:6; Ps. 100:3; Eccl. 7:29; (Eph. 4:24); James 3:9" },{ "type": "text", "content": "male and female He created them. " }],[{ "type": "text", "content": "Then God blessed them, and God said to them, " },{ "type": "note", "content": "Gen. 9:6; Ps. 100:3; Eccl. 7:29; (Eph. 4:24); James 3:9" },{ "type": "text", "content": "\"Be fruitful and multiply; fill the earth and " },{ "type": "note", "content": "Gen. 9:6; Ps. 100:3; Eccl. 7:29; (Eph. 4:24); James 3:9" },{ "type": "text", "content": "subdue it; have dominion over the fish of the sea, over the birds of the air, and over every living thing that moves on the earth.\"" }],[{ "type": "p", "content": "And God said, \"See, I have given you every herb " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields seed which " },{ "type": "it", "content": "is" },{ "type": "text", "content": " on the face of all the earth, and every tree whose fruit yields seed; " },{ "type": "note", "content": "Gen. 9:3; Ps. 104:14, 15" },{ "type": "text", "content": "to you it shall be for food. " }],[{ "type": "text", "content": "Also, to " },{ "type": "note", "content": "Gen. 9:3; Ps. 104:14, 15" },{ "type": "text", "content": "every beast of the earth, to every " },{ "type": "note", "content": "Gen. 9:3; Ps. 104:14, 15" },{ "type": "text", "content": "bird of the air, and to everything that creeps on the earth, in which " },{ "type": "it", "content": "there is" },{ "type": "text", "content": " life, " },{ "type": "it", "content": "I have given" },{ "type": "text", "content": " every green herb for food\"; and it was so. " }],[{ "type": "text", "content": "Then " },{ "type": "note", "content": "Gen. 9:3; Ps. 104:14, 15" },{ "type": "text", "content": "God saw everything that He had made, and indeed " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " very good. So the evening and the morning were the sixth day." }]];

function App({ title }: App) {

    store = useStore();
    const deselect = () => store.dispatch(deselectSidenote(docId));

    // DYNAMICALLY GENERATE BIBLE CONTENTS
    // split content into paragraphs
    var paragraphs = new Array();
    let temp = new Array();

    for (let i = 0; i < test.length; i++) {

        if (test[i][0].type == 'p') {
            paragraphs.push(temp);
            temp = new Array();
        }

        //verse numbers
        if (i == 0) {
            temp.push({"type":"label prime", "content":i+1});
        }
        else {
            temp.push({"type":"label", "content":i+1});
        }

        //content
        test[i].forEach(section => {
            temp.push(section);
        });
    }

    // format paragraphs
    const content = paragraphs.map((paragraph: Array<any>) => {

        // format contents of paragraph
        const paraContent = paragraph.map((item) => {
            //footnotes
            if (item.type == 'note') {
                return (
                    <span className="note">
                        <span className=" body"> {item.content}</span>
                    </span>
                );
            }
    
            //other formatting
            return (
                <span className={item.type}>{item.content}</span>
            );
        });

        return (
            <>
                <div className="p">
                    {paraContent}
                </div>
            </>
        );
    });

    return (
        <>
            <article id={docId} onClick={deselect}>
                <h1>Genesis 1</h1>

                {/* BIBLE */}
                <AnchorBase anchor={baseAnchor} className="base">

                    {content /* autofill from JSON */}

                </AnchorBase>
                <p className="notice">Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.</p>

                {/* SIDENOTES */}
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