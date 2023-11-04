import pytest
import os
import shutil
import json
from extract import extract

manifest = []
directory = ''


@pytest.fixture(scope="module")
def setup_teardown_module():
    global manifest
    global directory

    directory = os.path.join(os.path.dirname(__file__), 'data', 'NKJV')

    # SETUP
    try:
        with open(os.path.join(os.path.dirname(__file__), '..', 'public', 'manifest.json'), 'r') as f:
            manifest = json.load(f)
    except FileNotFoundError:
        assert False, 'manifest.json not found'

    assert os.path.isdir(os.path.join(directory, 'source')), 'Scripture directory does not exist'
    extract(os.path.join(directory, 'source'), os.path.join(directory, '_test'))

    yield  # RUN TESTS

    # TEARDOWN  
    shutil.rmtree(os.path.join(directory, '_test'))


def test_fileShape(setup_teardown_module):

    for book in manifest:
        for chapter, verseCount in enumerate(book['chapters']):

            filepath = os.path.join(directory, '_test', f'{book["usfm"]}.{chapter+1}')
            try:
                with open(filepath, 'r') as f:
                    fileContents = json.load(f)
            except FileNotFoundError:
                assert False, f'{book["usfm"]}.{chapter+1} not generated'

            assert (len(fileContents) == verseCount), f'{book["usfm"]}.{chapter+1} has {len(fileContents)} verses, but should have {verseCount} verses'


def test_fileContents(setup_teardown_module):

    # this doesn't test formatting or notes' contents, just the body's plaintext content

    test = 'GEN.1'
    expected = [
        "In the beginning God created the heavens and the earth.",
        "The earth was without form, and void; and darkness was on the face of the deep. And the Spirit of God was hovering over the face of the waters.",
        "Then God said, “Let there be light”; and there was light.",
        "And God saw the light, that it was good; and God divided the light from the darkness.",
        "God called the light Day, and the darkness He called Night. So the evening and the morning were the first day.",
        "Then God said, “Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.”",
        "Thus God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament; and it was so.",
        "And God called the firmament Heaven. So the evening and the morning were the second day.",
        "Then God said, “Let the waters under the heavens be gathered together into one place, and let the dry land appear”; and it was so.",
        "And God called the dry land Earth, and the gathering together of the waters He called Seas. And God saw that it was good.",
        "Then God said, “Let the earth bring forth grass, the herb that yields seed, and the fruit tree that yields fruit according to its kind, whose seed is in itself, on the earth”; and it was so.",
        "And the earth brought forth grass, the herb that yields seed according to its kind, and the tree that yields fruit, whose seed is in itself according to its kind. And God saw that it was good.",
        "So the evening and the morning were the third day.",
        "Then God said, “Let there be lights in the firmament of the heavens to divide the day from the night; and let them be for signs and seasons, and for days and years;",
        "and let them be for lights in the firmament of the heavens to give light on the earth”; and it was so.",
        "Then God made two great lights: the greater light to rule the day, and the lesser light to rule the night. He made the stars also.",
        "God set them in the firmament of the heavens to give light on the earth,",
        "and to rule over the day and over the night, and to divide the light from the darkness. And God saw that it was good.",
        "So the evening and the morning were the fourth day.",
        "Then God said, “Let the waters abound with an abundance of living creatures, and let birds fly above the earth across the face of the firmament of the heavens.”",
        "So God created great sea creatures and every living thing that moves, with which the waters abounded, according to their kind, and every winged bird according to its kind. And God saw that it was good.",
        "And God blessed them, saying, “Be fruitful and multiply, and fill the waters in the seas, and let birds multiply on the earth.”",
        "So the evening and the morning were the fifth day.",
        "Then God said, “Let the earth bring forth the living creature according to its kind: cattle and creeping thing and beast of the earth, each according to its kind”; and it was so.",
        "And God made the beast of the earth according to its kind, cattle according to its kind, and everything that creeps on the earth according to its kind. And God saw that it was good.",
        "Then God said, “Let Us make man in Our image, according to Our likeness; let them have dominion over the fish of the sea, over the birds of the air, and over the cattle, over all the earth and over every creeping thing that creeps on the earth.”",
        "So God created man in His own image; in the image of God He created him; male and female He created them.",
        "Then God blessed them, and God said to them, “Be fruitful and multiply; fill the earth and subdue it; have dominion over the fish of the sea, over the birds of the air, and over every living thing that moves on the earth.”",
        "And God said, “See, I have given you every herb that yields seed which is on the face of all the earth, and every tree whose fruit yields seed; to you it shall be for food.",
        "Also, to every beast of the earth, to every bird of the air, and to everything that creeps on the earth, in which there is life, I have given every green herb for food”; and it was so.",
        "Then God saw everything that He had made, and indeed it was very good. So the evening and the morning were the sixth day."
    ]

    filepath = os.path.join(directory, '_test', f'{test}')
    try:
        with open(filepath, 'r') as f:
            fileContents = json.load(f)
    except FileNotFoundError:
        assert False, f'{test} not generated'

    for verseNumber, verse in enumerate(fileContents):

        verseContents = ''

        for section in verse:
            try:
                if (section['type'] == 'note'):
                    continue  # skip footnotes
            except KeyError:
                pass

            try:
                verseContents += section['content']
            except KeyError:
                continue

        assert (verseContents.strip() == expected[verseNumber]), f"{test}'s content does not match expected output"
