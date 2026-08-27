/**
 * App entry point.
 * Owns: initializing page modules and wiring up cross-cutting event listeners
 * that don't belong to one specific component.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initNotFoundSearch();

    // Mobile Menu Toggle (Accessibility enhancement)
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            mainNav.classList.toggle('open', !isExpanded);
        });
    }

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

    // Audio button playback (Module 23)
    // Listens for clicks on any enabled pronunciation audio button.
    document.addEventListener('click', (event) => {
        const audioBtn = event.target.closest('.audio-btn');
        if (!audioBtn || audioBtn.disabled) return;

        playPronunciationAudio(audioBtn.dataset.audioUrl);
    });

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