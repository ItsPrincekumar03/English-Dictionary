/**
 * API module
 * Owns: all communication with the backend server.
 * This is the ONLY file that should ever contain a fetch URL or endpoint path.
 * search.js should call these functions and never touch fetch() directly.
 *
 * IMPORTANT: This module handles communication ONLY. It never touches
 * the DOM. It classifies failures into a small set of structured error
 * types and throws them — search.js decides what to do with each type,
 * ui.js decides how to render it.
 */

// Detect if we are running locally, otherwise use the production API URL.
// UPDATE 'https://api.yourdomain.com' with the real production backend URL before deploying.
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost 
    ? 'http://localhost:5000/api' 
    : 'https://api.yourdomain.com/api';

async function searchWord(word) {
    const trimmedWord = typeof word === 'string' ? word.trim() : '';

    if (trimmedWord === '') {
        throw { type: 'client', message: 'Please enter a word to search.' };
    }

    const encodedWord = encodeURIComponent(trimmedWord);

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/words/${encodedWord}`);
    } catch (networkErr) {
        // fetch() only rejects for genuine network-level failures —
        // DNS failure, connection refused (backend down), CORS block,
        // offline. It never rejects because of an HTTP error status.
        console.error('[api] Network error while fetching word:', networkErr);
        throw {
            type: 'network',
            message: 'Unable to connect to the dictionary service. Please check your internet connection and try again.'
        };
    }

    if (response.status === 404) {
        // Word-not-found is handled as its own category so search.js can
        // route it to a dedicated UI instead of the general error state.
        throw { type: 'not-found' };
    }

    if (!response.ok) {
        if (response.status === 429) {
            console.warn(`[api] Rate limit exceeded`);
            throw {
                type: 'rate-limit',
                message: 'Too many requests. Please wait a moment and try again.',
                status: 429
            };
        }

        if (response.status >= 500) {
            console.error(`[api] Server error: HTTP ${response.status}`);
            throw {
                type: 'server',
                message: 'Something went wrong on our server. Please try again later.',
                status: response.status
            };
        }

        // Any other non-2xx, non-404 status (400, 401, 403, etc.)
        console.error(`[api] Client error: HTTP ${response.status}`);
        throw {
            type: 'client',
            message: 'There was a problem with your request. Please try again.',
            status: response.status
        };
    }

    let result;
    try {
        result = await response.json();
    } catch (parseErr) {
        console.error('[api] Failed to parse JSON response:', parseErr);
        throw {
            type: 'invalid-response',
            message: "We couldn't load the dictionary result. Please try again."
        };
    }

    // A 200 OK doesn't guarantee the body actually has the shape we expect.
    // Guard against success:false or a missing/malformed data payload.
    if (!result || result.success !== true || !result.data) {
        console.error('[api] Unexpected response shape:', result);
        throw {
            type: 'invalid-response',
            message: "We couldn't load the dictionary result. Please try again."
        };
    }

    return result.data;
}