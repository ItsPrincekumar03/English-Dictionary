/**
 * App entry point.
 * Owns: initializing page modules and wiring up cross-cutting event listeners
 * that don't belong to one specific component.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initNotFoundSearch();

    // Retry button: re-attempts the last search
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            hideErrorState();
            if (typeof lastSearchTerm !== 'undefined' && lastSearchTerm) {
                runSearch(lastSearchTerm);
            }
        });
    }

    // Clicking any synonym/antonym/related-word tag anywhere on the page
    // triggers a brand new search for that word, reusing the exact same
    // pipeline as the main search form.
    document.addEventListener('click', (event) => {
        const tagBtn = event.target.closest('.tag[data-word]');
        if (!tagBtn) return;

        const word = tagBtn.dataset.word;
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = word;

        runSearch(word);
    });
});