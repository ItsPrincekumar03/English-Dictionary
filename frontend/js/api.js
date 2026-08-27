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
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost
    ? 'http://localhost:5000/api'
    : 'https://english-dictionary-api.onrender.com/api';

// Bounded in-memory cache for search results to avoid duplicate network requests
const dictionaryCache = new Map();
const MAX_CACHE_SIZE = 50;

async function searchWord(word) {
    const trimmedWord = typeof word === 'string' ? word.trim() : '';

    if (trimmedWord === '') {
        throw { type: 'client', message: 'Please enter a word to search.' };
    }

    const normalizedKey = trimmedWord.toLowerCase();
    
    // Check local cache first
    if (dictionaryCache.has(normalizedKey)) {
        return dictionaryCache.get(normalizedKey);
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

    // Update bounded cache
    if (dictionaryCache.size >= MAX_CACHE_SIZE) {
        // Remove the oldest entry (first item returned by keys iterator)
        dictionaryCache.delete(dictionaryCache.keys().next().value);
    }
    dictionaryCache.set(normalizedKey, result.data);

    return result.data;
}

const suggestionCache = new Map();

/**
 * Fetches autocomplete suggestions for a partial word.
 * Returns an array of matching word strings, or an empty array
 * on any failure — suggestions are a nice-to-have, so a failed
 * request here should never show an error state to the user.
 */
async function getSuggestions(prefix) {
    const trimmed = typeof prefix === 'string' ? prefix.trim() : '';
    if (trimmed === '') return [];

    const normalizedKey = trimmed.toLowerCase();
    
    if (suggestionCache.has(normalizedKey)) {
        return suggestionCache.get(normalizedKey);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/words/suggest/${encodeURIComponent(trimmed)}`);
        if (!response.ok) return [];

        const result = await response.json();
        if (!result || result.success !== true || !Array.isArray(result.data)) return [];

        if (suggestionCache.size >= MAX_CACHE_SIZE) {
            suggestionCache.delete(suggestionCache.keys().next().value);
        }
        suggestionCache.set(normalizedKey, result.data);

        return result.data;
    } catch (err) {
        // Silently fail — a broken suggestions request should never
        // interrupt typing or show an error to the user.
        console.error('[api] Suggestions request failed:', err);
        return [];
    }
}