"""Test tokenise.py"""
# pylint: disable=fixme, line-too-long, invalid-name, superfluous-parens, trailing-whitespace, arguments-differ

from tokenise import tokenise

def test_GEN_1_1():
    """Test GEN 1:1 tokenisation"""

    inputs = [
        (
            [ # NKJV
                { "header": "The History of Creation", "type": "p", "content": "In the " },
                { "type": "note", "content": "Ps. 102:25; Is. 40:21; (John 1:1-3; Heb. 1:10)" },
                { "content": "beginning " },
                { "type": "note", "content": "Gen. 2:4; (Ps. 8:3; 89:11; 90:2); Is. 44:24; Acts 17:24; Rom. 1:20; (Heb. 1:2; 11:3); Rev. 4:11" },
                { "content": "God created the heavens and the earth. " }
            ],
            [0, None, 0, None, 2, 1, 4, 5, 6]
        ),
        (
            [ # ESV
                { "header": "The Creation of the World", "type": "p", "content": " " },
                { "content": "In the " },
                { "type": "note", "content": "Job 38:4-7; Ps. 33:6; 136:5; Isa. 42:5; 45:18; John 1:1-3; Acts 14:15; 17:24; Col. 1:16, 17; Heb. 1:10; 11:3; Rev. 4:11" },
                { "content": "beginning, God created the heavens and the earth. " }
            ],
            [0, None, 0, 2, 1, 4, 5, 6]
        )
    ]

    strongs = {
        0: { "strongs": "7225", "eng": "In the beginning" },
        1: { "strongs": "1254", "eng": "created" },
        2: { "strongs": "430", "eng": "God" },
        3: { "strongs": "853", "eng": "-" },
        4: { "strongs": "8064", "eng": "the heavens" },
        5: { "strongs": "853", "eng": "and" },
        6: { "strongs": "776", "eng": "the earth" }
    }

    for data, expected in inputs:
        res = tokenise(data, strongs)

        assert(len(res) == len(expected))

        for index, item in enumerate(res):
            assert(expected[index] == item.get('token'))

    assert(True)
