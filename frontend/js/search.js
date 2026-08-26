/**
 * Search module
 * Owns: mock dictionary data, input validation, and the search pipeline
 * (runSearch → searchWord → success/not-found/error).
 * Does NOT touch the DOM directly except reading input values —
 * all rendering is delegated to ui.js functions.
 */

// ===== Autocomplete mock word list (unchanged from Module 6) =====
// ===== Autocomplete mock word list (expanded to match the dictionary below) =====
const MOCK_WORDS = [
    'happy', 'beautiful', 'computer', 'run', 'bank', 'sad'
];

// ===== Mock dictionary data =====
// Shape mirrors the intended MongoDB document structure:
// { word, pronunciation: { uk, us }, audio: { uk, us }, meanings, synonyms, antonyms, relatedWords }
const MOCK_DICTIONARY = {

    happy: {
        word: 'happy',
        pronunciation: { uk: '/ˈhæpi/', us: '/ˈhæpi/' },
        audio: { uk: '', us: '' },
        meanings: [
            {
                partOfSpeech: 'adjective',
                definitions: [
                    {
                        text: 'Feeling or showing pleasure, contentment, or satisfaction.',
                        examples: ['She was happy with the result.', 'He looked happy today.']
                    },
                    {
                        text: 'Having a positive or pleasant nature.',
                        examples: ['They lived a long and happy life together.']
                    }
                ]
            },
            {
                partOfSpeech: 'noun',
                definitions: [
                    {
                        text: 'A feeling of great pleasure or satisfaction (informal use).',
                        examples: ['Pure happy washed over her.']
                    }
                ]
            }
        ],
        synonyms: ['joyful', 'cheerful', 'pleased'],
        antonyms: ['sad', 'unhappy', 'miserable'],
        relatedWords: ['happiness', 'happily', 'unhappy']
    },
    sad: {
        word: 'sad',
        pronunciation: { uk: '/sæd/', us: '/sæd/' },
        audio: { uk: '', us: '' },
        meanings: [
            {
                partOfSpeech: 'adjective',
                definitions: [
                    {
                        text: 'Feeling or showing sorrow; unhappy.',
                        examples: ['She felt sad after the news.']
                    }
                ]
            }
        ],
        synonyms: ['unhappy', 'sorrowful', 'downcast'],
        antonyms: ['happy', 'joyful'],
        relatedWords: ['sadness', 'sadly']
    },

    beautiful: {
        word: 'beautiful',
        pronunciation: { uk: '/ˈbjuːtɪfʊl/', us: '/ˈbjuːtɪfəl/' },
        audio: { uk: '', us: '' },
        meanings: [
            {
                partOfSpeech: 'adjective',
                definitions: [
                    {
                        text: 'Pleasing the senses or mind aesthetically.',
                        examples: ['The sunset was absolutely beautiful.', 'She has a beautiful voice.']
                    }
                ]
            }
        ],
        synonyms: ['gorgeous', 'lovely', 'stunning'],
        antonyms: ['ugly', 'hideous'],
        relatedWords: ['beauty', 'beautifully']
    },

    computer: {
        word: 'computer',
        pronunciation: { uk: '/kəmˈpjuːtə/', us: '/kəmˈpjuːtər/' },
        audio: { uk: '', us: '' },
        meanings: [
            {
                partOfSpeech: 'noun',
                definitions: [
                    {
                        text: 'An electronic device for storing and processing data.',
                        examples: ['She works on her computer every day.']
                    }
                ]
            }
        ],
        synonyms: [],
        antonyms: [],
        relatedWords: ['computing', 'computerize']
    },

    run: {
        word: 'run',
        pronunciation: { uk: '/rʌn/', us: '/rʌn/' },
        audio: { uk: '', us: '' },
        meanings: [
            {
                partOfSpeech: 'verb',
                definitions: [
                    {
                        text: 'Move at a speed faster than a walk, never having both feet on the ground at once.',
                        examples: ['She runs five miles every morning.', 'He ran to catch the bus.']
                    },
                    {
                        text: 'Manage or operate a business, organization, or system.',
                        examples: ['They run a small bakery downtown.']
                    }
                ]
            },
            {
                partOfSpeech: 'noun',
                definitions: [
                    {
                        text: 'An act or spell of running.',
                        examples: ['She went for a run before breakfast.']
                    },
                    {
                        text: 'A continuous period or sequence of similar events.',
                        examples: ['The team is on a winning run.']
                    }
                ]
            }
        ],
        synonyms: ['sprint', 'jog', 'dash'],
        antonyms: ['walk', 'stop'],
        relatedWords: ['runner', 'running', 'rerun']
    },

    bank: {
        word: 'bank',
        pronunciation: { uk: '/bæŋk/', us: '/bæŋk/' },
        audio: { uk: '', us: '' },
        meanings: [
            {
                partOfSpeech: 'noun',
                definitions: [
                    {
                        text: 'A financial institution that accepts deposits and provides loans.',
                        examples: ['She deposited the check at the bank.']
                    },
                    {
                        text: 'The land practical alongside or sloping down to a river or lake.',
                        examples: ['They sat on the bank and watched the water flow.']
                    }
                ]
            },
            {
                partOfSpeech: 'verb',
                definitions: [
                    {
                        text: 'Deposit money into a bank account.',
                        examples: ['He banks his salary every month.']
                    }
                ]
            }
        ],
        synonyms: ['riverside', 'shore'],
        antonyms: [],
        relatedWords: ['banking', 'banker']
    }

};

// Tracks the most recent search term, so the Retry button can re-attempt it.
let lastSearchTerm = '';
let isSearching = false; // Prevents overlapping/duplicate searches

/**
 * Simulates an async dictionary lookup.
 * Resolves with word data, or rejects with { type: 'not-found' } or { type: 'error', message }.
 * The word "error" is a deliberate manual trigger for testing the error state —
 * there is no real failure condition without a backend.
 */
function performSearch(term) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const key = term.toLowerCase();

            if (key === 'error') {
                reject({ type: 'error', message: 'Simulated network failure. Please try again.' });
                return;
            }

            const data = MOCK_DICTIONARY[key];
            if (data) {
                resolve(data);
            } else {
                reject({ type: 'not-found' });
            }
        }, 700);
    });
}

/**
 * The shared search pipeline. Used by the main form, the not-found form,
 * and clicking any synonym/antonym/related-word tag.
 */
async function runSearch(term) {
    const query = term.trim();
    if (query === '') return;

    // Guard against duplicate/overlapping searches
    if (isSearching) return;

    isSearching = true;
    lastSearchTerm = query;
    setSearchControlsDisabled(true);
    showLoadingState(query);

    try {
        const data = await searchWord(query);
        renderResult(data);
    } catch (err) {
        if (err && err.type === 'not-found') {
            showNotFoundState(query);
        } else {
            showErrorState(err && err.message);
        }
    } finally {
        // Runs regardless of success, not-found, or error
        hideLoadingState();
        setSearchControlsDisabled(false);
        isSearching = false;
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

    function getMatches(query) {
        const normalized = query.trim().toLowerCase();
        if (normalized === '') return [];
        return MOCK_WORDS.filter(word => word.startsWith(normalized));
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

    input.addEventListener('input', () => {
        clearBtn.hidden = input.value.length === 0;
        const matches = getMatches(input.value);
        renderSuggestions(matches);
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