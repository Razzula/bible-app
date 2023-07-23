import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getUSFM } from '../../main/utils/bibleReferences';

describe('bibleReferences Tests', () => {

  it('Standard Reference (Chapter)', () => {
    const usfm = getUSFM('Genesis 1');

    expect(usfm[0]['book']).to.equal('GEN');
    expect(usfm[0]['initialChapter']).to.equal(1);
  });

  it('Standard Reference (Numerical)', () => {
    ['II Corinthians 12', '2 Corinthians 12'].forEach((reference: string) => {
      const usfm = getUSFM(reference);

      expect(usfm[0]['book']).to.equal('2CO');
      expect(usfm[0]['initialChapter']).to.equal(12);
    });
  });

  it('Standard Reference (Chapter:Verse)', () => {
    const usfm = getUSFM('John 3:16');

    expect(usfm[0]['book']).to.equal('JHN');
    expect(usfm[0]['initialChapter']).to.equal(3);
    expect(usfm[0]['initialVerse']).to.equal(16);
  });

  it('Shorthand Reference', () => {
    const usfm = getUSFM('Gen. 1');

    expect(usfm[0]['book']).to.equal('GEN');
    expect(usfm[0]['initialChapter']).to.equal(1);
  });

  it('Chapter Spanning Reference', () => {
    const usfm = getUSFM('Genesis 1-2');

    expect(usfm[0]['book']).to.equal('GEN');
    expect(usfm[0]['initialChapter']).to.equal(1);
    expect(usfm[0]['finalChapter']).to.equal(2);
  });

  it('Verse Spanning Reference', () => {
    ['Romans 8:28-29', 'Romans 8:28 - 29'].forEach((reference: string) => {
      const usfm = getUSFM(reference);

      expect(usfm[0]['book']).to.equal('ROM');
      expect(usfm[0]['initialChapter']).to.equal(8);
      expect(usfm[0]['initialVerse']).to.equal(28);
      expect(usfm[0]['finalVerse']).to.equal(29);
    });
  });

  it('Multiple References (;)', () => {
    const usfm = getUSFM('Genesis 1; Exodus 2');

    expect(usfm[0]['book']).to.equal('GEN');
    expect(usfm[0]['initialChapter']).to.equal(1);
    expect(usfm[1]['book']).to.equal('EXO');
    expect(usfm[1]['initialChapter']).to.equal(2);
  });

  it('Multiple References (Intrachapter)', () => {
    const usfm = getUSFM('Genesis 1; 2:1-2');

    expect(usfm[0]['book']).to.equal('GEN');
    expect(usfm[0]['initialChapter']).to.equal(1);
    expect(usfm[1]['book']).to.equal('GEN');
    expect(usfm[1]['initialChapter']).to.equal(2);
    expect(usfm[1]['initialVerse']).to.equal(1);
    expect(usfm[1]['finalVerse']).to.equal(2);
  });

  it('Multiple References (,)', () => {
    const usfm = getUSFM('Genesis 3:15, 16-18');

    expect(usfm[0]['book']).to.equal('GEN');
    expect(usfm[0]['initialChapter']).to.equal(3);
    expect(usfm[0]['initialVerse']).to.equal(15);
    expect(usfm[1]['book']).to.equal('GEN');
    expect(usfm[1]['initialChapter']).to.equal(3);
    expect(usfm[1]['initialVerse']).to.equal(16);
    expect(usfm[1]['finalVerse']).to.equal(18);
  });

  it('Chapter Reference', () => {
    ['Chapter 1', 'Ch. 1'].forEach((reference: string) => {
      const usfm = getUSFM(reference, 'GEN');

      expect(usfm[0]['book']).to.equal('GEN');
      expect(usfm[0]['initialChapter']).to.equal(1);
    });
  });

  it('Verse Reference', () => {
    ['Verse 15', 'v. 15'].forEach((reference: string) => {
      const usfm = getUSFM(reference, 'GEN', 3);

      expect(usfm[0]['book']).to.equal('GEN');
      expect(usfm[0]['initialChapter']).to.equal(3);
      expect(usfm[0]['initialVerse']).to.equal(15);
    });
  });
  
});