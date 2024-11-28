import { html, render } from 'lit-html';
import { getDictionaryTemplate } from './dictionary';
import { getAnkiTemplate, CardType, fetchAnkiDecks } from "./anki";
import { callForvo } from "./forvo-client"
import { getSentencesTemplate } from './example-sentences';
import { renderExternalLinks } from './links';

const definitionContainer = document.getElementById('side-panel-definition-container');
const audioContainer = document.getElementById('side-panel-audio-container');
const sentencesContainer = document.getElementById('sentences-container');
const linksContainer = document.getElementById('links-container');
const deckSelectorContainer = document.getElementById('deck-selector');

const tabContainer = document.getElementById('tabs');
const mainHeaderContainer = document.getElementById('main-header-container');

const tabToPanel = {
    'tab-definition': ['Definition', definitionContainer, () => !!definitionContainer.querySelector('.chineselearningextension-definition-item')],
    'tab-pronunciation': ['Audio', audioContainer, () => true],
    'tab-sentences': ['Sentences', sentencesContainer, () => !!sentencesContainer.querySelector('.example-sentence')],
    'tab-links': ['Links', linksContainer, () => false]
};

render(html`<h1 class="side-panel-header">Learn More</h1>`, mainHeaderContainer);
render(html`${Object.entries(tabToPanel).map((tab, index) => {
    return html`<h2 class="tab ${index === 0 ? 'active' : ''}" id="${tab[0]}" @click=${() => switchToTab(tab[0])}>${tab[1][0]}</h2>`
})}`, tabContainer);

function switchToTab(desiredTabId) {
    Object.entries(tabToPanel).forEach(tab => {
        if (tab[0] !== desiredTabId) {
            document.getElementById(tab[0]).classList.remove('active');
            tab[1][1].style.display = 'none';
        } else {
            document.getElementById(tab[0]).classList.add('active');
            tab[1][1].removeAttribute('style');
            if (tab[1][2]()) {
                deckSelectorContainer.removeAttribute('style');
            } else {
                deckSelectorContainer.style.display = 'none';
            }
        }
    });
}

let currentForvoKey;
let currentWord;
let audioElement;
let currentAnkiDecks = [];

chrome.storage.session.get('word', async ({ word }) => {
    currentWord = word;
    const response = await chrome.runtime.sendMessage({ type: 'definitions', word });
    if (!response.definitions) {
        return;
    }
    renderHeader(currentWord);
    currentAnkiDecks = await fetchAnkiDecks();
    renderDefinitionsSection(currentWord, response.definitions);
    renderSentencesSection(currentWord);
    render(renderExternalLinks(currentWord), linksContainer);
    renderDeckSelector(currentAnkiDecks);
});

async function renderAudioButton() {
    if (currentForvoKey) {
        const audioUrl = await callForvo(currentWord, currentForvoKey);
        if (!audioUrl) {
            return;
        }
        audioElement = document.createElement('audio');
        audioElement.crossOrigin = 'anonymous';
        audioElement.src = audioUrl;
        audioElement.load();
        render(html`<button class="chinese-learning-extension-audio-button" @click=${playAudio}>Listen</button>
            <div>${getAnkiTemplate(currentWord, { audioUrl }, CardType.Audio, getDeckSelectionCallback())}</div>`, audioContainer);
        return;
    }
    // TODO: make clear to users the source of audio (forvo vs web speech api vs other)
    render(html`<button class="chinese-learning-extension-audio-button" @click=${playAudio}>Listen</button>`, audioContainer);
}

chrome.storage.session.onChanged.addListener(async (changes) => {
    if (changes['forvoKey']) {
        // currently only one or the other can be sent...
        currentForvoKey = changes['forvoKey'].newValue;
        return;
    }
    currentWord = changes['word'].newValue;

    if (!currentWord) {
        return;
    }
    const response = await chrome.runtime.sendMessage({
        type: 'definitions',
        word: currentWord
    });
    if (!response.definitions) {
        return;
    }
    audioElement = null;
    renderHeader(currentWord);
    currentAnkiDecks = await fetchAnkiDecks();
    renderDefinitionsSection(currentWord, response.definitions);
    renderAudioButton();
    renderSentencesSection(currentWord);
    render(renderExternalLinks(currentWord), linksContainer);
    renderDeckSelector(currentAnkiDecks);
});

function renderHeader(word) {
    render(html`<h1 class="chineselearningextension-side-panel-header">Learn More - ${word}</h1>`, mainHeaderContainer);
}

async function renderDefinitionsSection(currentWord, definitions) {
    const dictionaryTemplate = getDictionaryTemplate(currentWord, definitions);
    render(html`<div>${dictionaryTemplate}</div>
        <div>${getAnkiTemplate(currentWord, { definitions }, CardType.Definition, getDeckSelectionCallback())}</div>`, definitionContainer);
}

function getDeckSelectionCallback() {
    if (!currentAnkiDecks || currentAnkiDecks.length < 1) {
        return null;
    }
    return deckSelection;
}

function deckSelection() {
    const selector = deckSelectorContainer.querySelector('select');
    if (!selector) {
        return null;
    }
    return selector.value;
}
function renderDeckSelector(decks) {
    if (!decks || decks.length < 1) {
        return;
    }
    render(html`<label>Choose Anki deck to add to: <select>
        ${currentAnkiDecks.map((deck) =>
        html`<option value="${deck[0]}">${deck[0]}</option>`)}
            </select></label>`, deckSelectorContainer);
}

function playAudio() {
    // could also build in some kind of pending forvo promise thing, but for now just quickly fall back to
    // the web speech api
    if (audioElement) {
        audioElement.load();
        audioElement.play();
        return;
    }
    let utterance = new SpeechSynthesisUtterance();
    // TODO: cantonese, other languages?
    utterance.lang = 'zh-CN';
    utterance.text = currentWord;
    speechSynthesis.speak(utterance);
}

chrome.storage.session.get('forvoKey', async ({ forvoKey }) => {
    currentForvoKey = forvoKey;
    renderAudioButton();
});

async function renderSentencesSection(word) {
    const sentencesTemplate = await getSentencesTemplate(word, getDeckSelectionCallback());
    render(sentencesTemplate, sentencesContainer);
}