/**
 * UI module
 * Owns: all DOM rendering — toggling between loading/error/not-found/result,
 * and building the result card's contents from a data object.
 * Does NOT decide what data is correct — only displays what it's given.
 */

// ===== Audio playback (Module 23) =====

// One reusable Audio instance shared by both UK/US buttons, so repeated
// clicks or switching regions never stack up multiple overlapping sounds.
let pronunciationAudio = null;

/**
 * Validates a URL before it's ever assigned as an audio source.
 * Backend data is external input — this blocks unexpected schemes
 * (e.g. javascript:) or malformed values from reaching the DOM.
 */
function isSafeAudioUrl(url) {
    if (typeof url !== 'string' || url.trim() === '') return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

/**
 * Plays a pronunciation clip. Only ever invoked from a click handler,
 * so it never runs automatically — browser autoplay restrictions
 * are never a concern here.
 */
function playPronunciationAudio(url) {
    if (!isSafeAudioUrl(url)) return;

    if (!pronunciationAudio) {
        pronunciationAudio = new Audio();
    }

    // Stop anything currently playing before starting the new clip,
    // so quick UK → US clicks don't overlap.
    pronunciationAudio.pause();
    pronunciationAudio.currentTime = 0;
    pronunciationAudio.src = url;

    // play() returns a Promise that rejects on failure (broken file,
    // network issue, decode error). Catch it so it never surfaces as
    // a raw browser error or unhandled rejection.
    pronunciationAudio.play().catch((err) => {
        console.error('[ui] Audio playback failed:', err);
    });
}

/** Stops any in-progress pronunciation playback. */
function stopPronunciationAudio() {
    if (pronunciationAudio) {
        pronunciationAudio.pause();
    }
}

// ===== State toggling (Modules 13, 14, 15, 18, 23) =====

function showLoadingState(query) {
    stopPronunciationAudio(); // Stop any audio from the previous word

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

function hideLoadingState() {
    const loadingState = document.getElementById('loading-state');

    if (!loadingState) {
        console.error('Loading state element not found in the DOM.');
        return;
    }

    loadingState.hidden = true;
    // NOTE: does NOT touch resultCard visibility anymore. Revealing the
    // result card is renderResult()'s responsibility. This keeps
    // hideLoadingState() safe to call unconditionally in a finally block.
}

/**
 * Disables or re-enables the search input and button.
 * Used to prevent duplicate/overlapping searches while a request is
 * already in progress.
 */
function setSearchControlsDisabled(disabled) {
    const input = document.getElementById('search-input');
    const button = document.getElementById('search-btn');

    if (input) input.disabled = disabled;
    if (button) button.disabled = disabled;
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

// ===== Result rendering (Modules 20 & 21) =====

/**
 * Fills the existing result card markup with real word data.
 * Reuses the DOM structure already in index.html — only text content,
 * a few attributes, and the dynamic list sections are rebuilt.
 */
function renderResult(data) {
    const wordEl = document.getElementById('result-word');
    if (!wordEl) {
        console.error('Result card elements not found in the DOM.');
        return;
    }

    wordEl.textContent = data.word;

    // Pronunciation: reuse the two existing .pronunciation-item elements (UK, US)
    const pronItems = document.querySelectorAll('#result-pronunciation .pronunciation-item');
    const regions = [
        { label: 'UK', ipa: data.pronunciation?.uk, audioUrl: data.audio?.uk },
        { label: 'US', ipa: data.pronunciation?.us, audioUrl: data.audio?.us }
    ];

    pronItems.forEach((item, index) => {
        const info = regions[index];
        if (!info) return;
        const ipaEl = item.querySelector('.pronunciation-ipa');
        const audioBtn = item.querySelector('.audio-btn');

        if (ipaEl) ipaEl.textContent = info.ipa || '';

        if (audioBtn) {
            if (info.audioUrl) {
                audioBtn.dataset.audioUrl = info.audioUrl;
                audioBtn.disabled = false;
            } else {
                audioBtn.dataset.audioUrl = '';
                audioBtn.disabled = true;
            }
            audioBtn.setAttribute('aria-label', `Play ${info.label} pronunciation of ${data.word}`);
        }
    });

    renderMeanings(data.meanings);
    renderTagList('result-synonyms', data.synonyms, 'tag-synonym');
    renderTagList('result-antonyms', data.antonyms, 'tag-antonym');
    renderTagList('result-related', data.relatedWords, 'tag-related');

    resetFavoriteButton();

    document.getElementById('result-card').hidden = false;
}

function renderMeanings(meanings) {
    const container = document.getElementById('result-meanings');
    if (!container) return;
    container.innerHTML = '';

    meanings.forEach(meaning => {
        const block = document.createElement('section');
        block.className = 'meaning-block';

        const posTag = document.createElement('h3');
        posTag.className = 'pos-tag';
        posTag.textContent = meaning.partOfSpeech;
        block.appendChild(posTag);

        const list = document.createElement('ol');
        list.className = 'definitions-list';

        meaning.definitions.forEach(def => {
            const item = document.createElement('li');
            item.className = 'definition-item';

            const text = document.createElement('p');
            text.className = 'definition-text';
            text.textContent = def.text;
            item.appendChild(text);

            if (def.examples && def.examples.length > 0) {
                const examplesList = document.createElement('ul');
                examplesList.className = 'examples-list';

                def.examples.forEach(example => {
                    const exItem = document.createElement('li');
                    exItem.className = 'example-item';
                    exItem.textContent = `"${example}"`;
                    examplesList.appendChild(exItem);
                });

                item.appendChild(examplesList);
            }

            list.appendChild(item);
        });

        block.appendChild(list);
        container.appendChild(block);
    });
}

/**
 * Builds a tag list (synonyms, antonyms, or related words).
 * Hides the whole surrounding .result-block if there's no valid data,
 * rather than showing an empty labeled section.
 * Filters out any non-string or empty entries so malformed API data
 * (null, numbers, empty strings) can never reach the DOM.
 */
function renderTagList(containerId, words, tagClass) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const wrapper = container.closest('.result-block');
    container.innerHTML = '';

    // Defensive validation: only keep genuine, non-empty strings.
    // Handles undefined, null, non-array values, and mixed-type arrays.
    const validWords = Array.isArray(words)
        ? words.filter(word => typeof word === 'string' && word.trim() !== '')
        : [];

    if (validWords.length === 0) {
        if (wrapper) wrapper.hidden = true;
        return;
    }

    if (wrapper) wrapper.hidden = false;

    validWords.forEach(word => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `tag ${tagClass}`;
        button.dataset.word = word;
        button.textContent = word;
        li.appendChild(button);
        container.appendChild(li);
    });
}

function resetFavoriteButton() {
    const favBtn = document.getElementById('favorite-btn');
    if (!favBtn) return;
    favBtn.setAttribute('aria-pressed', 'false');
    const icon = favBtn.querySelector('span');
    if (icon) icon.textContent = '☆';
}