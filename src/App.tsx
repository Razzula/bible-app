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

//GEN1
// var test = [[{ "type": "p", "content": "In the " },{ "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },{ "type": "text", "content": "beginning " },{ "type": "note", "content": "Gen. 2:4; (Ps. 8:3; 89:11; 90:2); Is. 44:24; Acts 17:24; Rom. 1:20; (Heb. 1:2; 11:3); Rev. 4:11" },{ "type": "text", "content": "God created the heavens and the earth. " }],[{ "type": "text", "content": "The earth was " },{ "type": "note", "content": "Jer. 4:23" },{ "type": "text", "content": "without form, and void; and darkness " },{ "type": "it", "content": "was" },{ "type": "text", "content": " on the face of the deep. " },{ "type": "note", "content": "(Gen. 6:3); Job 26:13; Ps. 33:6; 104:30; Is. 40:13, 14" },{ "type": "text", "content": "And the Spirit of God was hovering over the face of the waters." }],[{ "type": "p", "content": "" },{ "type": "note", "content": "Ps. 33:6, 9" },{ "type": "text", "content": "Then God said, " },{ "type": "note", "content": "2 Cor. 4:6" },{ "type": "text", "content": "\"Let there be " },{ "type": "note", "content": "(Heb. 11:3)" },{ "type": "text", "content": "light\"; and there was light. " }],[{ "type": "text", "content": "And God saw the light, that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good; and God divided the light from the darkness. " }],[{ "type": "text", "content": "God called the light Day, and the " },{ "type": "note", "content": "Job 37:18; Ps. 19:2; 33:6; 74:16; 104:20; 136:5; Jer. 10:12" },{ "type": "text", "content": "darkness He called Night. So the evening and the morning were the first day." }],[{ "type": "p", "content": "Then God said, " },{ "type": "note", "content": "Job 37:18; Jer. 10:12; 2 Pet. 3:5" },{ "type": "text", "content": "\"Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.\" " }],[{ "type": "text", "content": "Thus God made the firmament, " },{ "type": "note", "content": "Job 38:8-11; Prov. 8:27-29" },{ "type": "text", "content": "and divided the waters which " },{ "type": "it", "content": "were" },{ "type": "text", "content": " under the firmament from the waters which " },{ "type": "it", "content": "were" },{ "type": "text", "content": " " },{ "type": "note", "content": "Ps. 148:4" },{ "type": "text", "content": "above the firmament; and it was so. " }],[{ "type": "text", "content": "And God called the firmament Heaven. So the evening and the morning were the second day." }],[{ "type": "p", "content": "Then God said, " },{ "type": "note", "content": "Job 26:10; Ps. 104:6-9; Prov. 8:29; Jer. 5:22; 2 Pet. 3:5" },{ "type": "text", "content": "\"Let the waters under the heavens be gathered together into one place, and " },{ "type": "note", "content": "Ps. 24:1, 2; 33:7; 95:5" },{ "type": "text", "content": "let the dry " },{ "type": "it", "content": "land" },{ "type": "text", "content": " appear\"; and it was so. " }],[{ "type": "text", "content": "And God called the dry " },{ "type": "it", "content": "land" },{ "type": "text", "content": " Earth, and the gathering together of the waters He called Seas. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good." }],[{ "type": "p", "content": "Then God said, \"Let the earth " },{ "type": "note", "content": "Ps. 65:9-13; 104:14; Heb. 6:7" },{ "type": "text", "content": "bring forth grass, the herb " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields seed, " },{ "type": "it", "content": "and" },{ "type": "text", "content": " the " },{ "type": "note", "content": "2 Sam. 16:1; Luke 6:44" },{ "type": "text", "content": "fruit tree " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields fruit according to its kind, whose seed " },{ "type": "it", "content": "is" },{ "type": "text", "content": " in itself, on the earth\"; and it was so. " }],[{ "type": "text", "content": "And the earth brought forth grass, the herb " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields seed according to its kind, and the tree " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields fruit, whose seed " },{ "type": "it", "content": "is" },{ "type": "text", "content": " in itself according to its kind. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good. " }],[{ "type": "text", "content": "So the evening and the morning were the third day." }],[{ "type": "p", "content": "Then God said, \"Let there be " },{ "type": "note", "content": "Deut. 4:19; Ps. 74:16; 136:5-9" },{ "type": "text", "content": "lights in the firmament of the heavens to divide the day from the night; and let them be for signs and " },{ "type": "note", "content": "Ps. 104:19" },{ "type": "text", "content": "seasons, and for days and years; " }],[{ "type": "text", "content": "and let them be for lights in the firmament of the heavens to give light on the earth\"; and it was so. " }],[{ "type": "text", "content": "Then God made two great lights: the " },{ "type": "note", "content": "Ps. 136:8" },{ "type": "text", "content": "greater light to rule the day, and the " },{ "type": "note", "content": "Deut. 17:3; Ps. 8:3" },{ "type": "text", "content": "lesser light to rule the night. " },{ "type": "it", "content": "He made" },{ "type": "text", "content": " " },{ "type": "note", "content": "Deut. 4:19; Job 38:7; Is. 40:26" },{ "type": "text", "content": "the stars also. " }],[{ "type": "text", "content": "God set them in the firmament of the " },{ "type": "note", "content": "Gen. 15:5; Jer. 33:20, 25" },{ "type": "text", "content": "heavens to give light on the earth, " }],[{ "type": "text", "content": "and to " },{ "type": "note", "content": "Jer. 31:35" },{ "type": "text", "content": "rule over the day and over the night, and to divide the light from the darkness. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good. " }],[{ "type": "text", "content": "So the evening and the morning were the fourth day." }],[{ "type": "p", "content": "Then God said, \"Let the waters abound with an abundance of living creatures, and let birds fly above the earth across the face of the firmament of the heavens.\" " }],[{ "type": "text", "content": "So " },{ "type": "note", "content": "Ps. 104:25-28" },{ "type": "text", "content": "God created great sea creatures and every living thing that moves, with which the waters abounded, according to their kind, and every winged bird according to its kind. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good. " }],[{ "type": "text", "content": "And God blessed them, saying, " },{ "type": "note", "content": "Gen. 8:17" },{ "type": "text", "content": "\"Be fruitful and multiply, and fill the waters in the seas, and let birds multiply on the earth.\" " }],[{ "type": "text", "content": "So the evening and the morning were the fifth day." }],[{ "type": "p", "content": "Then God said, \"Let the earth bring forth the living creature according to its kind: cattle and creeping thing and beast of the earth, " },{ "type": "it", "content": "each" },{ "type": "text", "content": " according to its kind\"; and it was so. " }],[{ "type": "text", "content": "And God made the beast of the earth according to its kind, cattle according to its kind, and everything that creeps on the earth according to its kind. And God saw that " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " good." }],[{ "type": "p", "content": "Then God said, " },{ "type": "note", "content": "Gen. 9:6; Ps. 100:3; Eccl. 7:29; (Eph. 4:24); James 3:9" },{ "type": "text", "content": "\"Let Us make man in Our image, according to Our likeness; " },{ "type": "note", "content": "Gen. 9:2; Ps. 8:6-8" },{ "type": "text", "content": "let them have dominion over the fish of the sea, over the birds of the air, and over the cattle, over all the earth and over every creeping thing that creeps on the earth.\" " }],[{ "type": "text", "content": "So God created man " },{ "type": "note", "content": "Gen. 5:2; 1 Cor. 11:7" },{ "type": "text", "content": "in His " },{ "type": "it", "content": "own" },{ "type": "text", "content": " image; in the image of God He created him; " },{ "type": "note", "content": "Matt. 19:4; (Mark 10:6-8)" },{ "type": "text", "content": "male and female He created them. " }],[{ "type": "text", "content": "Then God blessed them, and God said to them, " },{ "type": "note", "content": "Gen. 9:1, 7; Lev. 26:9" },{ "type": "text", "content": "\"Be fruitful and multiply; fill the earth and " },{ "type": "note", "content": "1 Cor. 9:27" },{ "type": "text", "content": "subdue it; have dominion over the fish of the sea, over the birds of the air, and over every living thing that moves on the earth.\"" }],[{ "type": "p", "content": "And God said, \"See, I have given you every herb " },{ "type": "it", "content": "that" },{ "type": "text", "content": " yields seed which " },{ "type": "it", "content": "is" },{ "type": "text", "content": " on the face of all the earth, and every tree whose fruit yields seed; " },{ "type": "note", "content": "Gen. 9:3; Ps. 104:14, 15" },{ "type": "text", "content": "to you it shall be for food. " }],[{ "type": "text", "content": "Also, to " },{ "type": "note", "content": "Ps. 145:15" },{ "type": "text", "content": "every beast of the earth, to every " },{ "type": "note", "content": "Job 38:41" },{ "type": "text", "content": "bird of the air, and to everything that creeps on the earth, in which " },{ "type": "it", "content": "there is" },{ "type": "text", "content": " life, " },{ "type": "it", "content": "I have given" },{ "type": "text", "content": " every green herb for food\"; and it was so. " }],[{ "type": "text", "content": "Then " },{ "type": "note", "content": "(Ps. 104:24; 1 Tim. 4:4)" },{ "type": "text", "content": "God saw everything that He had made, and indeed " },{ "type": "it", "content": "it was" },{ "type": "text", "content": " very good. So the evening and the morning were the sixth day." }]]
//GEN2
var test = [[{ "type": "p", "content": "Thus the heavens and the earth, and " },{ "type": "note", "content": "Ps. 33:6" },{ "type": "text", "content": "all the host of them, were finished. " }],[{ "type": "note", "content": "Ex. 20:9-11; 31:17; Heb. 4:4, 10" },{ "type": "text", "content": "And on the seventh day God ended His work which He had done, and He rested on the seventh day from all His work which He had done. " }],[{ "type": "text", "content": "Then God " },{ "type": "note", "content": "(Is. 58:13)" },{ "type": "text", "content": "blessed the seventh day and sanctified it, because in it He rested from all His work which God had created and made." }],[{ "type": "p", "content": "" },{ "type": "note", "content": "Gen. 1:1; Ps. 90:1, 2" },{ "type": "text", "content": "This " },{ "type": "it", "content": "is" },{ "type": "text", "content": " the history of the heavens and the earth when they were created, in the day that the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God made the earth and the heavens, " }],[{ "type": "text", "content": "before any " },{ "type": "note", "content": "Gen. 1:11, 12" },{ "type": "text", "content": "plant of the field was in the earth and before any herb of the field had grown. For the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God had not " },{ "type": "note", "content": "Gen. 7:4; Job 5:10; 38:26-28" },{ "type": "text", "content": "caused it to rain on the earth, and " },{ "type": "it", "content": "there was" },{ "type": "text", "content": " no man " },{ "type": "note", "content": "Gen. 3:23" },{ "type": "text", "content": "to till the ground; " }],[{ "type": "text", "content": "but a mist went up from the earth and watered the whole face of the ground." }],[{ "type": "p", "content": "And the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God formed man " },{ "type": "it", "content": "of" },{ "type": "text", "content": " the " },{ "type": "note", "content": "Gen. 3:19, 23; Ps. 103:14" },{ "type": "text", "content": "dust of the ground, and " },{ "type": "note", "content": "Job 33:4" },{ "type": "text", "content": "breathed into his " },{ "type": "note", "content": "Gen. 7:22" },{ "type": "text", "content": "nostrils the breath of life; and " },{ "type": "note", "content": "1 Cor. 15:45" },{ "type": "text", "content": "man became a living being." }],[{ "type": "p", "content": "The " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God planted " },{ "type": "note", "content": "Is. 51:3" },{ "type": "text", "content": "a garden " },{ "type": "note", "content": "Gen. 3:23, 24" },{ "type": "text", "content": "eastward in " },{ "type": "note", "content": "Gen. 4:16" },{ "type": "text", "content": "Eden, and there He put the man whom He had formed. " }],[{ "type": "text", "content": "And out of the ground the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God made " },{ "type": "note", "content": "Ezek. 31:8" },{ "type": "text", "content": "every tree grow that is pleasant to the sight and good for food. " },{ "type": "note", "content": "(Gen. 3:22; Rev. 2:7; 22:2, 14)" },{ "type": "text", "content": "The tree of life " },{ "type": "it", "content": "was" },{ "type": "text", "content": " also in the midst of the garden, and the tree of the knowledge of good and " },{ "type": "note", "content": "(Deut. 1:39)" },{ "type": "text", "content": "evil." }],[{ "type": "p", "content": "Now a river went out of Eden to water the garden, and from there it parted and became four riverheads. " }],[{ "type": "text", "content": "The name of the first " },{ "type": "it", "content": "is" },{ "type": "text", "content": " Pishon; it " },{ "type": "it", "content": "is" },{ "type": "text", "content": " the one which skirts " },{ "type": "note", "content": "Gen. 25:18" },{ "type": "text", "content": "the whole land of Havilah, where " },{ "type": "it", "content": "there is" },{ "type": "text", "content": " gold. " }],[{ "type": "text", "content": "And the gold of that land " },{ "type": "it", "content": "is" },{ "type": "text", "content": " good. " },{ "type": "note", "content": "Num. 11:7" },{ "type": "text", "content": "Bdellium and the onyx stone " },{ "type": "it", "content": "are" },{ "type": "text", "content": " there. " }],[{ "type": "text", "content": "The name of the second river " },{ "type": "it", "content": "is" },{ "type": "text", "content": " Gihon; it " },{ "type": "it", "content": "is" },{ "type": "text", "content": " the one which goes around the whole land of Cush. " }],[{ "type": "text", "content": "The name of the third river " },{ "type": "it", "content": "is" },{ "type": "text", "content": " " },{ "type": "note", "content": "Dan. 10:4" },{ "type": "text", "content": "Hiddekel; it " },{ "type": "it", "content": "is" },{ "type": "text", "content": " the one which goes toward the east of Assyria. The fourth river " },{ "type": "it", "content": "is" },{ "type": "text", "content": " the Euphrates." }],[{ "type": "p", "content": "Then the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God took the man and put him in the garden of Eden to tend and keep it. " }],[{ "type": "text", "content": "And the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God commanded the man, saying, \"Of every tree of the garden you may freely eat; " }],[{ "type": "text", "content": "but of the tree of the knowledge of good and evil " },{ "type": "note", "content": "Gen. 3:1, 3, 11, 17" },{ "type": "text", "content": "you shall not eat, for in the day that you eat of it " },{ "type": "note", "content": "Gen. 3:3, 19; (Rom. 6:23)" },{ "type": "text", "content": "you shall surely " },{ "type": "note", "content": "Rom. 5:12; 1 Cor. 15:21, 22" },{ "type": "text", "content": "die.\"" }],[{ "type": "p", "content": "And the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God said, \"" },{ "type": "it", "content": "It is" },{ "type": "text", "content": " not good that man should be alone; " },{ "type": "note", "content": "1 Cor. 11:8, 9; 1 Tim. 2:13" },{ "type": "text", "content": "I will make him a helper comparable to him.\" " }],[{ "type": "note", "content": "Gen. 1:20, 24" },{ "type": "text", "content": "Out of the ground the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God formed every beast of the field and every bird of the air, and " },{ "type": "note", "content": "Ps. 8:6" },{ "type": "text", "content": "brought " },{ "type": "it", "content": "them" },{ "type": "text", "content": " to Adam to see what he would call them. And whatever Adam called each living creature, that " },{ "type": "it", "content": "was" },{ "type": "text", "content": " its name. " }],[{ "type": "text", "content": "So Adam gave names to all cattle, to the birds of the air, and to every beast of the field. But for Adam there was not found a helper comparable to him." }],[{ "type": "p", "content": "And the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God caused a " },{ "type": "note", "content": "Gen. 15:12; 1 Sam. 26:12" },{ "type": "text", "content": "deep sleep to fall on Adam, and he slept; and He took one of his ribs, and closed up the flesh in its place. " }],[{ "type": "text", "content": "Then the rib which the " },{ "type": "sc", "content": "Lord" },{ "type": "text", "content": " God had taken from man He made into a woman, " },{ "type": "note", "content": "Gen. 3:20; 1 Tim. 2:13" },{ "type": "text", "content": "and He " },{ "type": "note", "content": "Heb. 13:4" },{ "type": "text", "content": "brought her to the man." }],[{ "type": "p", "content": "And Adam said:" },{ "type": "q1", "content": "\"This " },{ "type": "it", "content": "is" },{ "type": "text", "content": " now " },{ "type": "note", "content": "Gen. 29:14; Eph. 5:28-30" },{ "type": "text", "content": "bone of my bones" },{ "type": "q2", "content": "And flesh of my flesh;" },{ "type": "q2", "content": "She shall be called Woman," },{ "type": "q2", "content": "Because she was " },{ "type": "note", "content": "1 Cor. 11:8, 9" },{ "type": "text", "content": "taken out of Man.\"" }],[{ "type": "p", "content": "" },{ "type": "note", "content": "Matt. 19:5; Eph. 5:31" },{ "type": "text", "content": "Therefore a man shall leave his father and mother and " },{ "type": "note", "content": "Mark 10:6-8; 1 Cor. 6:16" },{ "type": "text", "content": "be joined to his wife, and they shall become one flesh." }],[{ "type": "p", "content": "" },{ "type": "note", "content": "Gen. 3:7, 10" },{ "type": "text", "content": "And they were both naked, the man and his wife, and were not " },{ "type": "note", "content": "Is. 47:3" },{ "type": "text", "content": "ashamed." }]]

function App({ title }: App) {

    store = useStore();
    const deselect = () => store.dispatch(deselectSidenote(docId));

    // DYNAMICALLY GENERATE BIBLE CONTENTS
    // split content into paragraphs
    var paragraphs = new Array();
    let temp = new Array();

    console.log(test);
    for (let i = 0; i < test.length; i++) {

        //content
        for (let ii = 0; ii < test[i].length; ii++) {
            let section = test[i][ii];
            
            if (section.type == 'p' || section.type == 'q1' || section.type == 'q2') {
                if (temp.length != 0) {
                    paragraphs.push(temp);
                }
                temp = new Array();
            }
            
            //verse numbers
            if (ii == 0) {
                if (i == 0) {
                    temp.push({"type":"label prime", "content":i+1});
                }
                else {
                    temp.push({"type":"label", "content":i+1});
                }   
            }
            
            temp.push(section);
        };
    }

    // format paragraphs
    const content = paragraphs.map((paragraph: Array<{type:string, content:string}>) => {

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

        let paraType = paragraph[0].type
        if (paraType.startsWith('label')) {
            paraType = paragraph[1].type
        }

        return (
            <>
                <div className={paraType}>
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