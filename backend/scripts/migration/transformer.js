const { normalizeWord, normalizePos } = require('./normalizer');

function transformSynsetsToWords(synsets, antonymPairs = [], pronunciations = []) {
  const wordMap = new Map();
  const synsetMap = new Map();
  
  synsets.forEach(s => synsetMap.set(s.id, s));

  // Build base objects
  synsets.forEach(synset => {
    const pos = normalizePos(synset.pos);
    const definition = synset.definition;
    const examples = synset.examples || [];

    if (!synset.members || !Array.isArray(synset.members)) return;

    synset.members.forEach(member => {
      const normWord = normalizeWord(member);
      if (!normWord) return;

      if (!wordMap.has(normWord)) {
        wordMap.set(normWord, {
          word: normWord,
          pronunciation: { uk: "", us: "" },
          audio: { uk: "", us: "" },
          meanings: [],
          synonyms: new Set(),
          antonyms: new Set(),
          relatedWords: new Set(),
          _synsetIds: new Set()
        });
      }

      const entry = wordMap.get(normWord);
      entry._synsetIds.add(synset.id);

      let meaning = entry.meanings.find(m => m.partOfSpeech === pos);
      if (!meaning) {
        meaning = { partOfSpeech: pos, definitions: [] };
        entry.meanings.push(meaning);
      }

      const isDuplicate = meaning.definitions.some(d => d.text === definition);
      if (!isDuplicate) {
        meaning.definitions.push({ text: definition, examples: [...examples] });
      }

      // Synonyms
      synset.members.forEach(syn => {
         const normSyn = normalizeWord(syn);
         if (normSyn && normSyn !== normWord) {
             entry.synonyms.add(normSyn);
         }
      });
    });
  });

  // Apply Semantic Relations (Synset-level)
  const relationKeys = ['hypernym', 'hyponym', 'similar', 'also', 'attribute', 'derivation', 'domain_topic', 'domain_region', 'domain_category', 'member_holonym', 'part_holonym', 'substance_holonym', 'member_meronym', 'part_meronym', 'substance_meronym'];

  synsets.forEach(sourceSynset => {
      sourceSynset.members.forEach(sourceMember => {
          const normSource = normalizeWord(sourceMember);
          if (!normSource || !wordMap.has(normSource)) return;
          const entry = wordMap.get(normSource);

          relationKeys.forEach(relType => {
              if (Array.isArray(sourceSynset[relType])) {
                  sourceSynset[relType].forEach(targetId => {
                      const targetSynset = synsetMap.get(targetId);
                      if (targetSynset && targetSynset.members) {
                          targetSynset.members.forEach(targetMember => {
                              const normTarget = normalizeWord(targetMember);
                              if (normTarget && normTarget !== normSource) {
                                  entry.relatedWords.add(normTarget);
                              }
                          });
                      }
                  });
              }
          });
      });
  });

  // Apply Lexical Relations (Sense-level Antonyms)
  antonymPairs.forEach(pair => {
      const normSource = normalizeWord(pair.source);
      const normTarget = normalizeWord(pair.target);
      if (normSource && normTarget && normSource !== normTarget && wordMap.has(normSource)) {
          const entry = wordMap.get(normSource);
          entry.antonyms.add(normTarget);
      }
  });
  
  // Apply Pronunciations
  pronunciations.forEach(pron => {
      const normWord = normalizeWord(pron.lemma);
      if (normWord && wordMap.has(normWord)) {
          const entry = wordMap.get(normWord);
          entry.pronunciation.uk = pron.uk || "";
          entry.pronunciation.us = pron.us || "";
      }
  });

  return Array.from(wordMap.values()).map(entry => {
    return {
      word: entry.word,
      pronunciation: entry.pronunciation,
      audio: entry.audio, // stays empty
      meanings: entry.meanings,
      synonyms: Array.from(entry.synonyms),
      antonyms: Array.from(entry.antonyms),
      relatedWords: Array.from(entry.relatedWords)
    };
  });
}

module.exports = { transformSynsetsToWords };
