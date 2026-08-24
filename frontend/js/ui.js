/**
 * UI module
 * Owns: all DOM rendering — toggling between loading/error/not-found/result,
 * and building the result card's contents from a data object.
 * Does NOT decide what data is correct — only displays what it's given.
 */

// ===== State toggling (Modules 13, 14, 15 — unchanged) =====

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

// ===== Result rendering (new in Module 20) =====

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
 * Hides the whole surrounding .result-block if there's no data for it,
 * rather than showing an empty labeled section.
 */
function renderTagList(containerId, words, tagClass) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const wrapper = container.closest('.result-block');
    container.innerHTML = '';

    if (!words || words.length === 0) {
        if (wrapper) wrapper.hidden = true;
        return;
    }

    if (wrapper) wrapper.hidden = false;

    words.forEach(word => {
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

// ===== Retry button (Module 14, updated to re-attempt the last search) =====

document.addEventListener('DOMContentLoaded', () => {
    const retryBtn = document.getElementById('retry-btn');

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            hideErrorState();
            if (typeof lastSearchTerm !== 'undefined' && lastSearchTerm) {
                runSearch(lastSearchTerm);
            }
        });
    }
});