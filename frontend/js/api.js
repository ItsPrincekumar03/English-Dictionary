/**
 * API module
 * Owns: all communication with the backend server.
 * This is the ONLY file that should ever contain a fetch URL or endpoint path.
 * search.js should call these functions and never touch fetch() directly —
 * that's the whole point of this abstraction layer.
 *
 * IMPORTANT: This module handles communication ONLY. It never touches
 * the DOM, never shows loading states, never displays error messages.
 * Those are the responsibility of ui.js and search.js.
 */

const API_BASE_URL = 'http://localhost:5000/api';

async function searchWord(word) {
    const trimmedWord = typeof word === 'string' ? word.trim() : '';

    if (trimmedWord === '') {
        throw { type: 'error', message: 'Please enter a word to search.' };
    }

    const encodedWord = encodeURIComponent(trimmedWord);

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/words/${encodedWord}`);
    } catch (networkErr) {
        throw { type: 'error', message: 'Unable to reach the server. Please check your connection.' };
    }

    if (response.status === 404) {
        throw { type: 'not-found' };
    }

    if (!response.ok) {
        throw { type: 'error', message: 'Something went wrong. Please try again.' };
    }

    let result;
    try {
        result = await response.json();
    } catch (parseErr) {
        throw { type: 'error', message: 'Received an unexpected response from the server.' };
    }

    return result.data;
}