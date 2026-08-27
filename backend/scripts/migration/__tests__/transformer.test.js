const { transformSynsetsToWords } = require('../transformer');

describe('transformer', () => {
  it('transforms single meaning correctly', () => {
    const synsets = [
      { id: "s1", pos: "a", definition: "Feeling pleasure.", examples: ["happy to see you"], members: ["happy"] }
    ];
    const result = transformSynsetsToWords(synsets);
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("happy");
    expect(result[0].meanings).toHaveLength(1);
    expect(result[0].meanings[0].partOfSpeech).toBe("adjective");
    expect(result[0].meanings[0].definitions[0].text).toBe("Feeling pleasure.");
    expect(result[0].meanings[0].definitions[0].examples).toEqual(["happy to see you"]);
  });

  it('handles antonyms and related words through relations', () => {
    const synsets = [
      { id: "s1", pos: "a", definition: "Good.", members: ["good"], similar: ["s3"] },
      { id: "s2", pos: "a", definition: "Bad.", members: ["bad"] },
      { id: "s3", pos: "a", definition: "Virtuous.", members: ["virtuous"] }
    ];
    const antonymPairs = [
      { source: "good", target: "bad" }
    ];
    const result = transformSynsetsToWords(synsets, antonymPairs);
    const goodEntry = result.find(r => r.word === 'good');
    expect(goodEntry.antonyms).toContain('bad');
    expect(goodEntry.relatedWords).toContain('virtuous');
  });

  it('maps pronunciation correctly', () => {
    const synsets = [
      { id: "s1", pos: "a", definition: "Feeling pleasure.", members: ["happy"] }
    ];
    const pronunciations = [
      { lemma: "happy", uk: "ˈhæpiː", us: "ˈhæpi" }
    ];
    const result = transformSynsetsToWords(synsets, [], pronunciations);
    const happyEntry = result.find(r => r.word === 'happy');
    expect(happyEntry.pronunciation.uk).toBe('ˈhæpiː');
    expect(happyEntry.pronunciation.us).toBe('ˈhæpi');
  });

  it('handles missing GB pronunciation gracefully', () => {
    const synsets = [
      { id: "s1", pos: "a", definition: "Feeling pleasure.", members: ["happy"] }
    ];
    const pronunciations = [
      { lemma: "happy", uk: "", us: "ˈhæpi" }
    ];
    const result = transformSynsetsToWords(synsets, [], pronunciations);
    const happyEntry = result.find(r => r.word === 'happy');
    expect(happyEntry.pronunciation.uk).toBe('');
    expect(happyEntry.pronunciation.us).toBe('ˈhæpi');
  });
});
