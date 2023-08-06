import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getUSFM, locateReferences } from '../../main/utils/bibleReferences';

describe('bibleReferences Tests', () => {

  describe('getUSFM() Tests', () => {
    it('Standard Reference (Chapter)', () => {
      const usfm = getUSFM('Genesis 1');

      expect(usfm[0].book).to.equal('GEN');
      expect(usfm[0].initialChapter).to.equal(1);
    });

    it('Standard Reference (Numerical)', () => {
      ['II Corinthians 12', '2 Corinthians 12'].forEach((reference: string) => {
        const usfm = getUSFM(reference);

        expect(usfm[0].book).to.equal('2CO');
        expect(usfm[0].initialChapter).to.equal(12);
      });
    });

    it('Standard Reference (Chapter:Verse)', () => {
      const usfm = getUSFM('John 3:16');

      expect(usfm[0].book).to.equal('JHN');
      expect(usfm[0].initialChapter).to.equal(3);
      expect(usfm[0].initialVerse).to.equal(16);
    });

    it('Shorthand Reference', () => {
      const usfm = getUSFM('Gen. 1');

      expect(usfm[0].book).to.equal('GEN');
      expect(usfm[0].initialChapter).to.equal(1);
    });

    it('Chapter Spanning Reference', () => {
      const usfm = getUSFM('Genesis 1-2');

      expect(usfm[0].book).to.equal('GEN');
      expect(usfm[0].initialChapter).to.equal(1);
      expect(usfm[0]['finalChapter']).to.equal(2);
    });

    it('Verse Spanning Reference', () => {
      ['Romans 8:28-29', 'Romans 8:28 - 29'].forEach((reference: string) => {
        const usfm = getUSFM(reference);

        expect(usfm[0].book).to.equal('ROM');
        expect(usfm[0].initialChapter).to.equal(8);
        expect(usfm[0].initialVerse).to.equal(28);
        expect(usfm[0].finalVerse).to.equal(29);
      });
    });

    it('Multiple References (;)', () => {
      const usfm = getUSFM('Genesis 1; Exodus 2');

      expect(usfm[0].book).to.equal('GEN');
      expect(usfm[0].initialChapter).to.equal(1);
      expect(usfm[1].book).to.equal('EXO');
      expect(usfm[1].initialChapter).to.equal(2);
    });

    it('Multiple References (Intrachapter)', () => {
      const usfm = getUSFM('Genesis 1; 2:1-2');

      expect(usfm[0].book).to.equal('GEN');
      expect(usfm[0].initialChapter).to.equal(1);
      expect(usfm[1].book).to.equal('GEN');
      expect(usfm[1].initialChapter).to.equal(2);
      expect(usfm[1].initialVerse).to.equal(1);
      expect(usfm[1].finalVerse).to.equal(2);
    });

    it('Multiple References (,)', () => {
      const usfm = getUSFM('Genesis 3:15, 16-18');

      expect(usfm[0].book).to.equal('GEN');
      expect(usfm[0].initialChapter).to.equal(3);
      expect(usfm[0].initialVerse).to.equal(15);
      expect(usfm[1].book).to.equal('GEN');
      expect(usfm[1].initialChapter).to.equal(3);
      expect(usfm[1].initialVerse).to.equal(16);
      expect(usfm[1].finalVerse).to.equal(18);
    });

    it('Chapter Reference', () => {
      ['Chapter 1', 'Ch. 1'].forEach((reference: string) => {
        const usfm = getUSFM(reference, 'GEN');

        expect(usfm[0].book).to.equal('GEN');
        expect(usfm[0].initialChapter).to.equal(1);
      });
    });

    it('Verse Reference', () => {
      ['Verse 15', 'v. 15'].forEach((reference: string) => {
        const usfm = getUSFM(reference, 'GEN', 3);

        expect(usfm[0].book).to.equal('GEN');
        expect(usfm[0].initialChapter).to.equal(3);
        expect(usfm[0].initialVerse).to.equal(15);
      });
    });
  });

  describe('locateReferences() Tests', () => {
    it('Empty input', () => {
      const references = locateReferences('');

      expect(references).to.deep.equal([]);
    });

    it('Invalid input', () => {
      const text = 'this is not a reference';
      const references = locateReferences(text);

      expect(references).to.deep.equal([[text, false]]);
    });

    it('Pure input', () => {
      const text = 'Genesis 3:15';
      const references = locateReferences(text);

      expect(references).to.deep.equal([[text, { "book": "GEN", "finalChapter": NaN, "finalVerse": NaN, "initialChapter": 3, "initialVerse": 15 }]]);
    });

    it('Standard input', () => {
      const references = locateReferences('Genesis 3:15; Exodus 2:1-2');

      expect(references).to.deep.equal([
        ['Genesis 3:15', { "book": "GEN", "finalChapter": NaN, "finalVerse": NaN, "initialChapter": 3, "initialVerse": 15 }],
        ['; ', false],
        ['Exodus 2:1-2', { "book": "EXO", "finalChapter": NaN, "finalVerse": 2, "initialChapter": 2, "initialVerse": 1 }],
      ]);

    });

    it('Standard input (shorthand nottion)', () => {
      const references = locateReferences('Genesis 3:15, 20');

      expect(references).to.deep.equal([
        ['Genesis 3:15', { "book": "GEN", "finalChapter": NaN, "finalVerse": NaN, "initialChapter": 3, "initialVerse": 15 }],
        [',', false],
        [' 20', { "book": "GEN", "finalVerse": NaN, "initialChapter": 3, "initialVerse": 20 }],
      ]);

    });

    [
      'clearly not a reference',
      'A cubit was about 18 inches or 45 centimeters', // use of numbers
      'Genesis is the book before Exodus', // use of book names
    ].forEach((input: string, i: number) => {
      it(`Illegal input (${i+1})`, () => {
          const references = locateReferences(input);
    
          expect(references).to.deep.equal([
            [input, false]
          ]);
    
        });
    });

  });
  
});