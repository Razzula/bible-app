"""Test tokenise.py"""

# pylint: disable=fixme, line-too-long, invalid-name, superfluous-parens, trailing-whitespace, arguments-differ

import os
import pytest
from tokenise import Tokeniser

def checkFilesExist(translation, passage):
    """A before test to check if necessary files for actual test."""
    rootDir = os.path.dirname(os.path.abspath(__file__))

    requiredFiles = [
        os.path.join(rootDir, '..', 'example', 'Scripture', translation, passage),
        os.path.join(rootDir, 'data', 'strongs', f'{passage}.json'),
    ]

    if (missingFiles := [f for f in requiredFiles if not os.path.exists(f)]):
        # Skip the test (expected fail) if the required files are missing
        pytest.xfail(f"Missing required files: {', '.join(missingFiles)}")

@pytest.mark.parametrize('verse,translation,expectedTokens', [
    # GENESIS 1
    ('1',  'NKJV', [1,1,1, 3, 2, 5,5, 6, 7,7]),
    ('2',  'NKJV', [1,1, 2, 3,3, 4,4, 5,5, None, 6, 7,7, 8,8,8, 9,9,9, 10,10, 11,11, 12, 13,13, 14,14,14]),
    ('3',  'NKJV', [1, 2, 1, 3,3,3, 4, 5,5,5, 6]),
    ('4',  'NKJV', [1, 2, 1, 4,4, 5, None,None, 6, 7, 8, 7, 10,10, 11, 12,12]),
    ('5',  'NKJV', [2, 1, 3,3, 4, 5,5,5, 6,6, 7, 8, 9,9, 10, 11,11, 10, 13,13, 12]),
    ('6',  'NKJV', [1, 2, 1, 3,3,3, 4,4, 5,5,5, 6,6,6, 7,7,7, 8, 10,10, 9, 11,11]),
    ('7',  'NKJV', [1, 2, 1, 4,4, 5,5, 7,7, 8, None, 9, 10,10, 6, 12,12, 13, None, 14, 15,15, 16,16,16, 17]),
    ('8',  'NKJV', [1, 2, 1, 3,3, 4, 5, 6,6, 7, 8,8, 7, 10,10, 9]),
    ('9',  'NKJV', [1, 2, 1, 3, 4,4, 5, 6,6, 3,3,3, 7, 9, 8, 10,10, 11,11, None, 10, 12,12, 12, 13]),
    ('10', 'NKJV', [1, 2, 1, 3,3, None, 4, 5,5,5,5, 6,6,6, 7,7, 8, 9, 10, 9, 11, None,None, 12]),
    ('11', 'NKJV', [1, 2, 1, 3, 4,4, 3,3, 5, 6,6, None, 7, 8, None, 9, 10, 9, None, 11, 12, 13,13,13,13, 14, 15, None, 16,16, 17, 18,18, 19,19,19, 20]),
    ('12', 'NKJV', [1, 2,2, 1,1, 3, 4,4, None, 5, 6, 7,7,7,7, 8,8,8, None, 9, 10, 11, 12, None, 13,13, 14,14,14,14, 15, 16, 15, 17, None,None, 18]),
    ('13', 'NKJV', [1, 2,2, 3, 4,4, 3, 6,6, 5]),
    ('14', 'NKJV', [1, 2, 1, 3,3,3, 4, 5,5,5, 6,6,6, 7,7, 9,9, 10, 11,11, 12,12,12,12, 13,13, 14,14, 15,15,15, 16,16]),
    ('15', 'NKJV', [1,1,1,1, 2,2, 3,3,3, 4,4,4, 5,5,5, 6, 7,7, 8,8,8, 9]),
    ('16', 'NKJV', [1, 2, 1, 4, 6, 5, 8, 9, 8, 10,10, 11,11, 12, 13, 14, 13, 15,15, 16,16, None,None, 18, 18, 17]),
    ('17', 'NKJV', [3, 1, 2, 4,4,4, 5,5,5, 6,6,6, 7, 8,8]),
    ('18', 'NKJV', [1,1,1, 2,2,2, 3,3,3,3, 4,4,4, 6,6, 7, 8,8, 9, 10, 9, 11, None,None, 12]),
    ('19', 'NKJV', [1, 2,2, 3, 4,4, 3, 6,6, 5]),
    ('20', 'NKJV', [1, 2, 1, 3, 4,4, 3, 5,5,5, 6, 7, 6, 8, 9, 8, 9, 10, 11,11, 12, 13,13, 14,14,14, 15,15,15]),
    ('21', 'NKJV', [1, 2, 1, 5, 4,4, 6, 7, 9, 8, 10,10, 11,11, 13,13, 12, 14,14,14,14, 15, 16, 19, 18, 20,20,20,20, 21, 22, 21, 23, None,None, 24]),
    ('22', 'NKJV', [1, 3, 1, 2, 4, 5,5, 6,6, 7,7, 9,9, 10,10,10, 11, 12, 11, 12, 13,13,13]),
    ('23', 'NKJV', [1, 2,2, 3, 4,4, 3, 6,6, 5]),
    ('24', 'NKJV', [1, 2, 1, 3, 4,4, 3,3, 5, 6, 5, 7,7,7,7, 8, 9,9,9, 10,10, 11,11,11, None, 12,12,12,12, 13,13,13, 14]),
    ('25', 'NKJV', [1, 2, 1, 4,4, 5,5,5, 6,6,6,6, 8, 9,9,9,9, 10, 11, 12,12,12, 13,13, 14,14,14,14, 15, 16, 15, 17, None,None, 18]),
    ('26', 'NKJV', [1, 2, 1, 3,3,3, 4, 5,5,5, 6,6,6,6, 7,7,7,7, 8,8,8, 9,9,9, 10,10,10, 11,11,11, 12,12,12,12, 13,13, 14,14, 15,15,15, 16,16, 17,17, 18, 19, 9]),
    ('27', 'NKJV', [1, 2, 1, 4, 5,5, None, 5, 6,6,6, 7,7, 8,8, 9, 10, 11,11, 12,12, 13]),
    ('28', 'NKJV', [1, 3, 1, 2, 4, 6, 4, 5,5, 7,7, 8,8, 9, 11,11, 12,12,12, 13,13, 14,14,14, 15,15,15, 16,16,16, 17,17,17, 18,18,18, 19,19, 20,20, 21, 22,22]),
    ('29', 'NKJV', [1, 2, 1, 3, 4,4,4, 5, 7, 8, None, 9, 10, 11, None, 12, 13,13, 14,14, 15,15, 16, 17, 18, 19, 21, 23, 24, 25,25, 26,26,26, 27,27]),
    ('30', 'NKJV', [1,1,1, 2, 3,3,3, 4,4, 5, 6,6,6, 7,7,7, 8,8, 9, 10,10, 12, 11, None,None, 14, None,None,None, 16, 17, 18, 19,19, 20,20,20, 21]),
    ('31', 'NKJV', [1, 2, 1, 4, 5, 6,6,6, 7,7, None,None, 9, 8, 10, 11,11, 12, 13,13, 12, 15,15, 14]),
])
def test_Genesis1(verse, translation, expectedTokens):
    """Test Genesis 1 tokenisation"""

    tokenisePassage('GEN.1', verse, translation, expectedTokens)

@pytest.mark.parametrize('verse,translation,expectedTokens', [
    # JOHN 1
    ('1',  'NKJV', [1,1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 16, 17, 15, 14]),
    ('2',  'NKJV', [1, 2, 3,3, 4, 5, 7]),
    ('3',  'NKJV', [1,1, 4,4, 2, 3, 5, 6, 7, [9,10], 8,8, 11, 12,12]),
    ('4',  'NKJV', [1, 2, 4, 3, 5, 6, 7, 8, 9, 10, 12,12]),
    ('5',  'NKJV', [1, 2, 3, 7, 4, 5, 6, 8, 9, 10, 13, 12, 13, 11]),
    ('6',  'NKJV', [1, 3, 2,2, 3, 4, 5, 7, 6, None, 9]),
    ('7',  'NKJV', [1,1, 2, 3, 4,4, [5,6],[5,6], 7, 8, 9, 10, 11, 13, 14, 12,12]),
    ('8',  'NKJV', [3, 2, 1, 4, 5, 6, None,None, [7,8],[7,8], 8, 9, 10, 11]),
    ('9',  'NKJV', []), # TODO
    ('10', 'NKJV', []), # TODO
    ('11', 'NKJV', []), # TODO
    ('12', 'NKJV', []), # TODO
    ('13', 'NKJV', []), # TODO
])
def test_John1(verse, translation, expectedTokens):
    """Test Genesis 1 tokenisation"""

    tokenisePassage('JHN.1', verse, translation, expectedTokens)

def tokenisePassage(passage, verse, translation, expectedTokens):
    """Test tokenisation"""

    # Check if necessary files exist
    checkFilesExist(translation, passage)

    # Tokenise the passage
    tokeniser = Tokeniser()
    tokens = tokeniser.tokenisePassage(passage, verse, translation, visualise=False, includeNotes=False)

    # Compare the tokens with the expected tokens
    assert len(tokens) == len(expectedTokens), f'Wrong number of token. Expected {len(expectedTokens)}, got {len(tokens)}'

    for index, token in enumerate(tokens):
        assert (
            str(token.get('token', None)) == str(expectedTokens[index])
        ), f'Incorrect token at index {index} ({token["content"]}): expected {expectedTokens[index]}, got {token.get("token")}'
