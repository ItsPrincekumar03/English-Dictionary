/**
 * Search module
 * Handles: capturing search input, showing mock autocomplete suggestions,
 * keyboard navigation of suggestions, and form submission.
 * No API/backend yet — suggestions come from a hardcoded mock list.
 */

// Temporary mock word list. Will be replaced by a real API call later.
const MOCK_WORDS = [
    'computer', 'company', 'complete', 'compare', 'compass',
    'happy', 'happen', 'hello', 'help', 'here',
    'search', 'season', 'second', 'secure', 'select'
];

function initSearch() {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    const suggestionsList = document.getElementById('suggestions-list');

    if (!form || !input || !clearBtn || !suggestionsList) {
        console.error('Search component: required elements not found in the DOM.');
        return;
    }

    // Tracks which suggestion is currently highlighted via keyboard (-1 = none)
    let activeIndex = -1;

    // --- Filtering logic ---
    function getMatches(query) {
        const normalized = query.trim().toLowerCase();
        if (normalized === '') return [];

        return MOCK_WORDS.filter(word => word.startsWith(normalized));
    }

    // --- Rendering the dropdown ---
    function renderSuggestions(matches) {
        suggestionsList.innerHTML = ''; // clear old suggestions
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

            // Clicking a suggestion selects it
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
    }

    function selectSuggestion(word) {
        input.value = word;
        closeSuggestions();
        clearBtn.hidden = false;
        input.focus();
    }

    // --- Keyboard highlight helper ---
    function updateActiveItem(items) {
        items.forEach((item, index) => {
            item.classList.toggle('active', index === activeIndex);
        });

        if (activeIndex >= 0 && items[activeIndex]) {
            items[activeIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    // --- Input typing: filter + show suggestions ---
    input.addEventListener('input', () => {
        clearBtn.hidden = input.value.length === 0;

        const matches = getMatches(input.value);
        renderSuggestions(matches);
    });

    // --- Keyboard navigation ---
    input.addEventListener('keydown', (event) => {
        const items = Array.from(suggestionsList.querySelectorAll('.suggestion-item'));

        if (suggestionsList.hidden || items.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault(); // stop cursor from moving inside the input
            activeIndex = (activeIndex + 1) % items.length;
            updateActiveItem(items);
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            updateActiveItem(items);
        }

        if (event.key === 'Enter' && activeIndex >= 0) {
            // A suggestion is highlighted — select it instead of submitting the form
            event.preventDefault();
            selectSuggestion(items[activeIndex].textContent);
        }

        if (event.key === 'Escape') {
            closeSuggestions();
        }
    });

    // --- Close suggestions when clicking outside the search area ---
    document.addEventListener('click', (event) => {
        const isClickInsideSearch = form.contains(event.target) || suggestionsList.contains(event.target);
        if (!isClickInsideSearch) {
            closeSuggestions();
        }
    });

    // --- Clear button ---
    clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.hidden = true;
        closeSuggestions();
        input.focus();
    });

    // --- Form submit ---
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const searchTerm = input.value.trim();
        closeSuggestions();

        if (searchTerm === '') {
            console.warn('Search term is empty — nothing to search.');
            input.focus();
            return;
        }

        console.log('Searching for:', searchTerm);
    });
}
// "Search again" form inside the Word Not Found state.
// Mirrors the same capture/validate pattern as the main search form (Module 5).
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

        console.log('Searching for:', searchTerm);
        hideNotFoundState();
    });
}