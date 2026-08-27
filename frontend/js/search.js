/**
 * Search module
 * Owns: input validation, and the search pipeline
 * (runSearch → searchWord → success/not-found/error).
 * all rendering is delegated to ui.js functions.
 */

// Tracks the most recent search term, so the Retry button can re-attempt it.
let lastSearchTerm = '';
// Increments on every runSearch so a slower, older response cannot
// overwrite a newer search (or leave loading stuck after a superseded request).
let searchRequestId = 0;


/**
 * The shared search pipeline. Used by the main form, the not-found form,
 * and clicking any synonym/antonym/related-word tag.
 */
async function runSearch(term) {
    const query = term.trim();
    if (query === '') return;

    const requestId = ++searchRequestId;
    lastSearchTerm = query;
    setSearchControlsDisabled(true);
    showLoadingState(query);

    try {
        const data = await searchWord(query);
        if (requestId !== searchRequestId) return;
        renderResult(data);
    } catch (err) {
        if (requestId !== searchRequestId) return;
        if (err && err.type === 'not-found') {
            showNotFoundState(query);
        } else {
            // network / server / client / invalid-response, and anything
            // unrecognized, all render through the general error UI. Each
            // type already carries its own safe, specific message from
            // api.js — search.js doesn't need to know the details, just
            // that this isn't the not-found case.
            showErrorState(err && err.message);
        }
    } finally {
        // Only the latest search may clear loading / re-enable controls.
        if (requestId !== searchRequestId) return;
        hideLoadingState();
        setSearchControlsDisabled(false);
    }
}

// ===== Main search form + autocomplete (Modules 5 & 6, updated to call runSearch) =====

function initSearch() {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    const suggestionsList = document.getElementById('suggestions-list');

    if (!form || !input || !clearBtn || !suggestionsList) {
        console.error('Search component: required elements not found in the DOM.');
        return;
    }

    let activeIndex = -1;

    async function getMatches(query) {
        const normalized = query.trim();
        if (normalized === '') return [];
        return await getSuggestions(normalized);
    }

    function renderSuggestions(matches) {
        suggestionsList.innerHTML = '';
        activeIndex = -1;

        if (matches.length === 0) {
            closeSuggestions();
            return;
        }

        matches.forEach((word, index) => {
            const li = document.createElement('li');
            li.textContent = word;
            li.className = 'suggestion-item';
            li.setAttribute('role', 'option');
            li.id = `suggestion-${index}`;

            li.addEventListener('click', () => {
                selectSuggestion(word);
            });

            suggestionsList.appendChild(li);
        });

        openSuggestions();
    }

    function openSuggestions() {
        suggestionsList.hidden = false;
        input.setAttribute('aria-expanded', 'true');
    }

    function closeSuggestions() {
        suggestionsList.hidden = true;
        suggestionsList.innerHTML = '';
        activeIndex = -1;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
    }

    function selectSuggestion(word) {
        input.value = word;
        closeSuggestions();
        clearBtn.hidden = false;
        input.focus();
        runSearch(word);
    }

    function updateActiveItem(items) {
        items.forEach((item, index) => {
            item.classList.toggle('active', index === activeIndex);
        });

        if (activeIndex >= 0 && items[activeIndex]) {
            items[activeIndex].scrollIntoView({ block: 'nearest' });
            input.setAttribute('aria-activedescendant', items[activeIndex].id);
        } else {
            input.removeAttribute('aria-activedescendant');
        }
    }

    let debounceTimeout = null;

    input.addEventListener('input', () => {
        clearBtn.hidden = input.value.length === 0;
        const currentValue = input.value;

        // Clear the previous timeout if the user types again quickly
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Wait 300ms after the last keystroke before making the API request
        debounceTimeout = setTimeout(async () => {
            const matches = await getMatches(currentValue);

            // Guard against a slow response landing after the user kept typing
            if (input.value === currentValue) {
                renderSuggestions(matches);
            }
        }, 300);
    });

    input.addEventListener('keydown', (event) => {
        const items = Array.from(suggestionsList.querySelectorAll('.suggestion-item'));
        if (suggestionsList.hidden || items.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            updateActiveItem(items);
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            updateActiveItem(items);
        }

        if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            selectSuggestion(items[activeIndex].textContent);
        }

        if (event.key === 'Escape') {
            closeSuggestions();
        }
    });

    document.addEventListener('click', (event) => {
        const isClickInsideSearch = form.contains(event.target) || suggestionsList.contains(event.target);
        if (!isClickInsideSearch) {
            closeSuggestions();
        }
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.hidden = true;
        closeSuggestions();
        input.focus();
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        closeSuggestions();

        const searchTerm = input.value.trim();
        if (searchTerm === '') {
            input.focus();
            return;
        }

        runSearch(searchTerm);
    });
}

// ===== "Search again" form inside the Word Not Found state (Module 15, updated) =====

function initNotFoundSearch() {
    const notFoundForm = document.getElementById('not-found-search-form');
    const notFoundInput = document.getElementById('not-found-search-input');

    if (!notFoundForm || !notFoundInput) {
        console.error('Not-found search form elements not found in the DOM.');
        return;
    }

    notFoundForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const searchTerm = notFoundInput.value.trim();
        if (searchTerm === '') {
            notFoundInput.focus();
            return;
        }

        runSearch(searchTerm);
    });
}