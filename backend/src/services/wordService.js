// src/services/wordService.js

const Word = require('../models/Word');

/**
 * Looks up a single word in the dictionary.
 *
 * This function is deliberately HTTP-agnostic: it takes a plain
 * string and returns either a word document or null. It knows
 * nothing about requests, responses, or status codes — that's
 * the controller's job, not this one.
 *
 * @param {string} word - the word to search for
 * @returns {Promise<Object|null>} the matching word document, or null if not found
 * @throws {Error} if the input is invalid (empty/not a string)
 */
async function getWordByName(word) {
    // Validate input BEFORE touching the database.
    // A service function should never assume its caller
    // already validated the input — it should be safe to
    // call from anywhere.
    if (!word || typeof word !== 'string' || word.trim() === '') {
        const error = new Error('Word is required');
        error.statusCode = 400; // Bad Request — caller's fault, not a server issue
        throw error;
    }

    const trimmedWord = word.trim();

    // Prevent unnecessarily large search strings
    if (trimmedWord.length > 100) {
        const error = new Error('Search term is too long');
        error.statusCode = 400;
        throw error;
    }

    // Validate allowed characters: letters, spaces, hyphens, and apostrophes.
    // Rejects HTML (<script>), special symbols (!, @, $), and pure numbers.
    const validWordRegex = /^[a-zA-Z\s\-']+$/;
    if (!validWordRegex.test(trimmedWord)) {
        const error = new Error('Invalid search term');
        error.statusCode = 400;
        throw error;
    }

    // Normalize the word the same way the schema does (lowercase, trimmed).
    // This isn't strictly required since Mongoose's `lowercase: true` on the
    // schema would normalize it anyway during a save, but for a QUERY,
    // we must normalize manually — Mongoose schema transforms only apply
    // on save, not automatically on every query filter.
    const normalizedWord = trimmedWord.toLowerCase();

    // Query MongoDB through the Word model.
    // .select('-__v -createdAt -updatedAt') removes fields the frontend does not need,
    // reducing payload size slightly and preventing unnecessary data transfer.
    // .lean() returns plain JavaScript objects instead of heavy Mongoose documents,
    // which is significantly faster for read-only queries.
    const result = await Word.findOne({ word: normalizedWord })
        .select('-__v -createdAt -updatedAt')
        .lean();

    return result; // either a Word document, or null
}

/**
 * Finds words starting with the given prefix, for autocomplete.
 * Returns an array of plain word strings (not full documents) —
 * the frontend only needs the words themselves for a suggestions dropdown.
 *
 * @param {string} prefix - partial word typed by the user
 * @returns {Promise<string[]>} up to 8 matching words, alphabetically sorted
 */
async function getSuggestions(prefix) {
    if (!prefix || typeof prefix !== 'string' || prefix.trim() === '') {
        return [];
    }

    const trimmed = prefix.trim();

    // Limit length to avoid expensive regex execution
    if (trimmed.length > 100) {
        return [];
    }

    // Same validation as getWordByName — letters, spaces, hyphens, apostrophes only.
    const validRegex = /^[a-zA-Z\s\-']+$/;
    if (!validRegex.test(trimmed)) {
        return [];
    }

    const normalized = trimmed.toLowerCase();

    // Escape regex special characters in the user input before building RegExp
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const results = await Word.find({ word: { $regex: '^' + escaped } })
        .select('word -_id')
        .sort({ word: 1 })
        .limit(8)
        .lean();

    return results.map(doc => doc.word);
}

module.exports = {
    getWordByName,
    getSuggestions
};