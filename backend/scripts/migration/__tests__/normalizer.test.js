const { normalizeWord, normalizePos } = require('../normalizer');

describe('normalizer', () => {
  describe('normalizeWord', () => {
    it('lowercases strings', () => {
      expect(normalizeWord('HAPPY')).toBe('happy');
    });
    it('trims whitespace', () => {
      expect(normalizeWord(' Happy ')).toBe('happy');
    });
    it('preserves hyphens', () => {
      expect(normalizeWord('mother-in-law')).toBe('mother-in-law');
    });
    it('preserves apostrophes', () => {
      expect(normalizeWord("don't")).toBe("don't");
    });
    it('preserves spaces (multi-word)', () => {
      expect(normalizeWord('make up')).toBe('make up');
    });
    it('rejects empty or whitespace-only', () => {
      expect(normalizeWord('')).toBeNull();
      expect(normalizeWord('   ')).toBeNull();
    });
    it('rejects non-strings', () => {
      expect(normalizeWord(123)).toBeNull();
      expect(normalizeWord({})).toBeNull();
    });
    it('rejects invalid characters like numbers or HTML', () => {
      expect(normalizeWord('h4ppy')).toBeNull();
      expect(normalizeWord('hello<br>')).toBeNull();
    });
  });

  describe('normalizePos', () => {
    it('maps parts of speech correctly', () => {
      expect(normalizePos('n')).toBe('noun');
      expect(normalizePos('v')).toBe('verb');
      expect(normalizePos('a')).toBe('adjective');
      expect(normalizePos('s')).toBe('adjective');
      expect(normalizePos('r')).toBe('adverb');
      expect(normalizePos('x')).toBe('unknown');
    });
  });
});
