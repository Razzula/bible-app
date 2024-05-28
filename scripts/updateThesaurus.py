# pylint: disable=fixme, line-too-long, invalid-name, superfluous-parens, trailing-whitespace, arguments-differ, annotation-unchecked
"""Script to append new entries to the thesaurus."""
import json
import os
import re

def loadThesaurus(filename):
    """Load the thesaurus from a JSON file."""
    with open(filename, 'r', encoding='utf-8') as file:
        return json.load(file)

def saveThesaurus(thesaurus, filename):
    """Save the thesaurus to a JSON file."""
    tempFilename = filename #+ '.bak'
    with open(tempFilename, 'w', encoding='utf-8') as file:
        json.dump(thesaurus, file, indent=4)

    # reformat
    with open(tempFilename, 'r', encoding='utf-8') as file:
        temp = file.read()
    temp = re.sub(re.compile(r'\n                '), ' ', temp)
    temp = re.sub(re.compile(r'"\n            '), '" ', temp)
    with open(tempFilename, 'w', encoding='utf-8') as f:
        f.write(temp)

def addEntries(thesarus, word1, word2, pos, marker=None):
    """Adds entry symmetrically."""
    addEntry(thesarus, word1, word2, pos, marker)
    addEntry(thesarus, word2, word1, pos, marker)

def addEntry(thesaurus, word1, word2, pos, marker=None):
    """Add a new entry to the thesaurus."""

    if (word1 not in thesaurus):
        thesaurus[word1] = {pos: [[word2]]}
        print(f'Added new entry: {word1} - {pos}: {word2}')
        print()
    else:
        if (pos not in thesaurus[word1]):
            thesaurus[word1][pos] = [[word2]]
            print(f'Added new POS: {word1} - {pos}: {word2}')
            print()
        else:
            for synonyms in thesaurus[word1][pos]:
                if (word2 in synonyms):
                    print(f'{word2} already exists in {word1} under {pos}')
                    print()
                    return

            if (marker is None):
                print(f'Current options for {word1} under {pos}: {thesaurus[word1][pos]}')
                choice = input(f'Do you want to add {word2} to an existing list or create a new one? (index) ').strip().lower()

                if (choice == ''): # new
                    thesaurus[word1][pos].append([word2])
                    print(f'Created new list for {word2} under {pos}')

                else: # existing
                    try:
                        index = int(choice)
                        if (index < len(thesaurus[word1][pos])):
                            existingWords = thesaurus[word1][pos][index]

                            thesaurus[word1][pos][index].append(word2)
                            print(f'Added {word2} to existing list at index {index}')

                            for alternateSynonym in existingWords:
                                addEntries(thesaurus, alternateSynonym, word2, pos, word1)
                    except TypeError:
                        # revert to new
                        print('Invalid index. Adding to new.')
                        thesaurus[word1][pos].append([word2])
                        print(f'Created new list for {word2} under {pos}')

                print()

            else:
                for index, synonyms in enumerate(thesaurus[word1][pos]):
                    if (marker in synonyms):
                        thesaurus[word1][pos][index].append(word2)

def main():
    """Main function."""
    rootDir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    filename = os.path.join(rootDir, 'scripts', 'data', 'en_thesaurus.json')
    thesaurus = loadThesaurus(filename)

    while (True):
        word1 = input('Enter the first word: ').strip()
        word2 = input('Enter the second word: ').strip()
        pos = input('Enter the part of speech (e.g., n, v, r): ').strip()
        print()

        addEntries(thesaurus, word1, word2, pos)

        cont = input('Do you want to add another entry? (y/n): ').strip().lower()
        if (cont != 'y'):
            break

    saveThesaurus(thesaurus, filename)
    print('Thesaurus updated successfully')

if (__name__ == '__main__'):
    main()
