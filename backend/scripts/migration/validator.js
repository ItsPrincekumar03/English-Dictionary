function validateMigrationRecord(record) {
  if (!record || typeof record !== 'object') return 'INVALID';
  if (!record.word || typeof record.word !== 'string' || record.word.trim() === '') return 'SKIPPED';
  if (!/^[a-zA-Z\s\-']+$/.test(record.word)) return 'SKIPPED';
  if (!record.meanings || !Array.isArray(record.meanings) || record.meanings.length === 0) return 'SKIPPED';

  record.meanings = record.meanings.filter(meaning => {
    if (!meaning.partOfSpeech || typeof meaning.partOfSpeech !== 'string') return false;
    if (!meaning.definitions || !Array.isArray(meaning.definitions)) return false;
    
    meaning.definitions = meaning.definitions.filter(def => {
       if (!def.text || typeof def.text !== 'string') return false;
       if (!Array.isArray(def.examples)) def.examples = []; // optional array recovery
       return true;
    });
    
    return meaning.definitions.length > 0;
  });

  if (record.meanings.length === 0) return 'SKIPPED';

  if (!Array.isArray(record.synonyms)) record.synonyms = [];
  if (!Array.isArray(record.antonyms)) record.antonyms = [];
  if (!Array.isArray(record.relatedWords)) record.relatedWords = [];

  return 'VALID';
}

module.exports = { validateMigrationRecord };
