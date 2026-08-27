// src/controllers/wordController.js

const wordService = require('../services/wordService');

/**
 * Handles GET /api/words/:word
 *
 * Controller responsibilities only: read the request, call the
 * service, shape the HTTP response. No database logic here.
 */
async function getWord(req, res, next) {
    try {
        const { word } = req.params;

        const result = await wordService.getWordByName(word);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Word not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        // Unexpected errors (e.g. invalid input, DB failure) are
        // handed off to errorHandler.js — the controller does not
        // format error responses itself.
        next(error);
    }
}

/**
 * Handles GET /api/words/suggest/:prefix
 * Controller responsibilities only — no query logic here.
 */
async function getSuggestions(req, res, next) {
    try {
        const { prefix } = req.params;
        const suggestions = await wordService.getSuggestions(prefix);

        return res.status(200).json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getWord,
    getSuggestions
};