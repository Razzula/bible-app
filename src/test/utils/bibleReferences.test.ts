import { expect } from 'chai';
import { describe, it } from 'mocha';

import { getUSFM } from '../../main/utils/bibleReferences';

describe('bibleReferences Tests', () => {

  it('Standard Reference', () => {
    let usfm = getUSFM('Genesis 3:15');

    expect(usfm['book']).to.equal('GEN');
    expect(usfm['initialChapter']).to.equal('3');
    expect(usfm['initialVerse']).to.equal(15);
  });
  
});