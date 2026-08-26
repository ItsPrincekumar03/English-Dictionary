/**
 * API module
 * Owns: all communication with the backend server.
 * This is the ONLY file that should ever contain a fetch URL or endpoint path.
 * search.js should call these functions and never touch fetch() directly —
 * that's the whole point of this abstraction layer.
 *
 * IMPORTANT: No backend exists yet. These functions are written and ready,
 * but nothing in the app currently calls them (search.js still uses mock data).
 * Calling searchWord() right now will fail with a network error, which is expected.
 */

// Change this once a real backend is running (e.g. during local development
// it might be 'http://localhost:5000', and something else in production).
const API_BASE_URL = '/api';

/**
 * Fetches a single word's dictionary entry from the backend.
 * Intended endpoint: GET /api/words/:word
 *
 * Returns a Promise that:
 *   - resolves with the word data object on success
 *   - rejects with { type: 'not-found' } if the server returns 404
 *   - rejects with { type: 'error', message } for any other failure
 *     (server error, network failure, malformed response, etc.)
 *
 * This resolve/reject shape intentionally matches what search.js's
 * performSearch() already produces from mock data, so swapping the
 * data source later requires no changes anywhere else.
 */
async function searchWord(word) {
    const encodedWord = encodeURIComponent(word);

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/words/${encodedWord}`);
    } catch (networkErr) {
        // fetch() itself throws on network-level failures (server unreachable,
        // no internet, CORS blocked, etc.) — never on a 404 or 500, those are
        // valid responses and are handled below instead.
        throw { type: 'error', message: 'Unable to reach the server. Please check your connection.' };
    }

    if (response.status === 404) {
        throw { type: 'not-found' };
    }

    if (!response.ok) {
        throw { type: 'error', message: 'Something went wrong. Please try again.' };
    }

    try {
        const data = await response.json();
        return data;
    } catch (parseErr) {
        throw { type: 'error', message: 'Received an unexpected response from the server.' };
    }
}