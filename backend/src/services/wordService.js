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

    // Normalize the word the same way the schema does (lowercase, trimmed).
    // This isn't strictly required since Mongoose's `lowercase: true` on the
    // schema would normalize it anyway during a save, but for a QUERY,
    // we must normalize manually — Mongoose schema transforms only apply
    // on save, not automatically on every query filter.
    const normalizedWord = word.trim().toLowerCase();

    // Query MongoDB through the Word model.
    // findOne returns the matching document, or null if nothing matches —
    // which is exactly the contract we want to expose to callers.
    const result = await Word.findOne({ word: normalizedWord });

    return result; // either a Word document, or null
}

module.exports = {
    getWordByName
};