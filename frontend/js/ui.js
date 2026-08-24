/**
 * UI module
 * Reusable functions for toggling between the loading state, error state, and result card.
 */

function showLoadingState(query) {
    const loadingState = document.getElementById('loading-state');
    const resultCard = document.getElementById('result-card');
    const loadingQuery = document.getElementById('loading-query');
    const errorState = document.getElementById('error-state');
    const notFoundState = document.getElementById('not-found-state');

    if (!loadingState || !resultCard || !loadingQuery || !errorState || !notFoundState) {
        console.error('Loading state elements not found in the DOM.');
        return;
    }

    loadingQuery.textContent = query;
    loadingState.hidden = false;
    resultCard.hidden = true;
    errorState.hidden = true;
    notFoundState.hidden = true;
}

function showErrorState(message) {
    const errorState = document.getElementById('error-state');
    const resultCard = document.getElementById('result-card');
    const loadingState = document.getElementById('loading-state');
    const errorMessage = document.getElementById('error-message');
    const notFoundState = document.getElementById('not-found-state');

    if (!errorState || !resultCard || !loadingState || !errorMessage || !notFoundState) {
        console.error('Error state elements not found in the DOM.');
        return;
    }

    errorMessage.textContent = message || 'Please try again.';
    errorState.hidden = false;
    resultCard.hidden = true;
    loadingState.hidden = true;
    notFoundState.hidden = true;
}


function hideLoadingState() {
    const loadingState = document.getElementById('loading-state');
    const resultCard = document.getElementById('result-card');

    if (!loadingState || !resultCard) {
        console.error('Loading state elements not found in the DOM.');
        return;
    }

    loadingState.hidden = true;
    resultCard.hidden = false;
}



function hideErrorState() {

    const errorState = document.getElementById('error-state');
    const resultCard = document.getElementById('result-card');

    if (!errorState || !resultCard) {
        console.error('Error state elements not found in the DOM.');
        return;
    }

    errorState.hidden = true;
    resultCard.hidden = false;
}
function showNotFoundState(query) {
    const notFoundState = document.getElementById('not-found-state');
    const resultCard = document.getElementById('result-card');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const notFoundQuery = document.getElementById('not-found-query');

    if (!notFoundState || !resultCard || !loadingState || !errorState || !notFoundQuery) {
        console.error('Not-found state elements not found in the DOM.');
        return;
    }

    notFoundQuery.textContent = query;
    notFoundState.hidden = false;
    resultCard.hidden = true;
    loadingState.hidden = true;
    errorState.hidden = true;
}

function hideNotFoundState() {
    const notFoundState = document.getElementById('not-found-state');
    const resultCard = document.getElementById('result-card');

    if (!notFoundState || !resultCard) {
        console.error('Not-found state elements not found in the DOM.');
        return;
    }

    notFoundState.hidden = true;
    resultCard.hidden = false;
}
// Retry button: for now, just logs the intent and hides the error.
// A future API module will replace this console.log with a real re-fetch call.
document.addEventListener('DOMContentLoaded', () => {
    const retryBtn = document.getElementById('retry-btn');

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            console.log('Retry clicked — future module will re-attempt the last search here.');
            hideErrorState();
        });
    }
});