import { html, render } from 'lit-html';
import { getDictionaryTemplate } from './dictionary';
import { getAnkiTemplate, CardType, fetchAnkiDecks } from "./anki";
import { callForvo } from "./forvo-client"
import { getSentencesTemplate } from './example-sentences';

const definitionContainer = document.getElementById('side-panel-definition-container');
const audioContainer = document.getElementById('side-panel-audio-container');
const sentencesContainer = document.getElementById('sentences-container');
const deckSelectorContainer = document.getElementById('deck-selector');

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
    currentAnkiDecks = await fetchAnkiDecks();
    renderDefinitionsSection(currentWord, response.definitions);
    renderSentencesSection(currentWord);
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
    currentAnkiDecks = await fetchAnkiDecks();
    await renderDefinitionsSection(currentWord, response.definitions);
    renderAudioButton();
    renderSentencesSection(currentWord);
    renderDeckSelector(currentAnkiDecks);
});

async function renderDefinitionsSection(currentWord, definitions) {
    const dictionaryTemplate = getDictionaryTemplate(currentWord, definitions);
    render(html`<div>${dictionaryTemplate}</div>
        <div>${getAnkiTemplate(currentWord, { definitions }, CardType.Definition, getDeckSelectionCallback())}</div>`, definitionContainer);
}

function getDeckSelectionCallback() {
    if(!currentAnkiDecks || currentAnkiDecks.length < 1) {
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