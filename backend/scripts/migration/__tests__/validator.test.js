const { validateMigrationRecord } = require('../validator');

describe('validator', () => {
  it('marks valid records as VALID', () => {
    const record = {
      word: "happy",
      meanings: [{ partOfSpeech: "adjective", definitions: [{ text: "feeling pleasure" }] }]
    };
    expect(validateMigrationRecord(record)).toBe('VALID');
  });

  it('skips missing or empty word', () => {
    expect(validateMigrationRecord({ word: "", meanings: [{ partOfSpeech: "noun", definitions: [{ text: "test" }] }] })).toBe('SKIPPED');
    expect(validateMigrationRecord({ meanings: [{ partOfSpeech: "noun", definitions: [{ text: "test" }] }] })).toBe('SKIPPED');
  });

  it('skips words with invalid characters', () => {
    expect(validateMigrationRecord({ word: "t3st", meanings: [{ partOfSpeech: "noun", definitions: [{ text: "test" }] }] })).toBe('SKIPPED');
  });

  it('skips if meanings are missing or empty', () => {
    expect(validateMigrationRecord({ word: "test", meanings: [] })).toBe('SKIPPED');
  });

  it('skips if partOfSpeech or definitions are missing', () => {
    const record = {
      word: "test",
      meanings: [{ definitions: [{ text: "test" }] }] // no pos
    };
    expect(validateMigrationRecord(record)).toBe('SKIPPED');
  });

  it('filters out bad definitions and meanings, skipping if none left', () => {
    const record = {
      word: "test",
      meanings: [{ partOfSpeech: "noun", definitions: [{ text: 123 }] }] // bad def
    };
    expect(validateMigrationRecord(record)).toBe('SKIPPED');
  });

  it('recovers optional arrays', () => {
    const record = {
      word: "test",
      meanings: [{ partOfSpeech: "noun", definitions: [{ text: "valid text", examples: null }] }],
      synonyms: null
    };
    expect(validateMigrationRecord(record)).toBe('VALID');
    expect(record.meanings[0].definitions[0].examples).toEqual([]);
    expect(record.synonyms).toEqual([]);
  });
});
