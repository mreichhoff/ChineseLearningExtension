import { html, render } from 'lit-html';
import { getDictionaryTemplate } from './dictionary';
import { getAnkiTemplate, CardType } from "./anki";
import { callForvo } from "./forvo-client"

const definitionContainer = document.getElementById('side-panel-definition-container');
const audioContainer = document.getElementById('side-panel-audio-container');

let currentForvoKey;
let currentWord;
let audioElement;

chrome.storage.session.get('word', async ({ word }) => {
    currentWord = word;
    const response = await chrome.runtime.sendMessage({ type: 'definitions', word });
    if (!response.definitions) {
        return;
    }
    renderDefinitionsSection(currentWord, response.definitions);
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
        const ankiSection = await getAnkiTemplate(currentWord, { audioUrl }, CardType.Audio);
        render(html`<button class="chinese-learning-extension-audio-button" @click=${playAudio}>Listen</button>
            <div><h3>Add audio to Anki?</h3>
            <div>${ankiSection}</div>`, audioContainer);
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
    await renderDefinitionsSection(currentWord, response.definitions);
    renderAudioButton();
});

async function renderDefinitionsSection(currentWord, definitions) {
    const dictionaryTemplate = getDictionaryTemplate(currentWord, definitions);
    const ankiTemplate = await getAnkiTemplate(currentWord, { definitions }, CardType.Definition);
    render(html`<div>${dictionaryTemplate}</div><h3>Add definition to Anki?</h3><div>${ankiTemplate}</div>`, definitionContainer);
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