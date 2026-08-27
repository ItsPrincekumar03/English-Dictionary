function normalizeWord(word) {
  if (!word || typeof word !== 'string' || word.trim() === '') {
    return null;
  }
  const trimmed = word.trim();
  const validRegex = /^[a-zA-Z\s\-']+$/;
  if (!validRegex.test(trimmed)) {
    return null; // invalid
  }
  return trimmed.toLowerCase();
}

function normalizePos(pos) {
  switch (pos) {
    case 'n': return 'noun';
    case 'v': return 'verb';
    case 'a':
    case 's': return 'adjective';
    case 'r': return 'adverb';
    default: return 'unknown';
  }
}

module.exports = { normalizeWord, normalizePos };
