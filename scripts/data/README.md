# Bible App Data

This directory contains the data files for the Bible App. It includes the following files:

- **Thesaurus**: A thesaurus file that provides synonyms and related words for different terms used in the Bible.
- **Transliterated Words Trie**: A trie data structure that stores transliterated words from the Bible for efficient searching and retrieval.
- **Bible Data**: The entire Bible text represented using Strongs numbers and a basic English translation per word.

## File Descriptions

### Thesaurus

The thesaurus file is a resource used in the tokenisation process of the Bible App. It contains a list of synonyms and related words for different terms used in the Bible. This file is used to improve the accuracy of the tokenisation process by providing a greater bredath of matches during pairing.

This thesaurus is derived from the WordNet lexical database. This version is slightly condensed, as only entries where either the word itself, or one of its synonyms, appear in the list. This is to reduce the size of the thesaurus, and to ensure that only relevant entries are included.

Refer to [WordNet License](https://wordnet.princeton.edu/license-and-commercial-use) for usage.

### Transliterated Words Trie

The transliterated words trie is a data structure that organizes transliterated words from the Bible's original languages in a hierarchical manner. This data structure allows for efficient searching and retrieval of words based on their transliteration.

### Bible Data

The Bible data file contains the complete text of the Bible, represented using Strongs numbers and a basic English translation per word. This format enables advanced analysis and study of the scriptures, including word-level searches and cross-referencing. This is the basis of truth for the tokenisation process.
