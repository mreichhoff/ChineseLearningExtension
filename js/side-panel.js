import { html, render } from 'lit-html';
import { getDictionaryTemplate } from './dictionary';
import { getAnkiTemplate, CardType, fetchAnkiDecks, fetchExistingCards, setAnkiConnectKey } from "./anki";
import { callForvo } from "./forvo-client"
import { getSentencesTemplate } from './example-sentences';
import { renderExternalLinks } from './links';
import { renderAiTab } from './ai';

const definitionContainer = document.getElementById('side-panel-definition-container');
const audioContainer = document.getElementById('side-panel-audio-container');
const sentencesContainer = document.getElementById('sentences-container');
const linksContainer = document.getElementById('links-container');
const aiContainer = document.getElementById('ai-container');
const deckSelectorContainer = document.getElementById('deck-selector');

const tabContainer = document.getElementById('tabs');
const mainHeaderContainer = document.getElementById('main-header-container');

const aiQuestionContainer = document.getElementById('ai-question-container');
const aiResponseContainer = document.getElementById('ai-response-container');

const tabToPanel = {
    'tab-definition': ['Define', definitionContainer, () => !!definitionContainer.querySelector('.chineselearningextension-definition-item')],
    // 'tab-pronunciation': ['Audio', audioContainer, () => true],
    'tab-sentences': ['Use', sentencesContainer, () => !!sentencesContainer.querySelector('.example-sentence')],
    'tab-links': ['Links', linksContainer, () => false],
    'tab-ai': ['AI', aiContainer, () => true]
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
let currentOpenAiKey;
let currentWord;
let currentSentence;
let audioElement;
let currentAnkiDecks = [];

async function updateWithCurrentWord() {
    const response = await chrome.runtime.sendMessage({
        type: 'definitions',
        word: currentWord
    });
    if (!response || !response.definitions) {
        return;
    }
    audioElement = null;
    renderHeader(currentWord);
    currentAnkiDecks = await fetchAnkiDecks();
    await fetchExistingCards();
    renderDefinitionsSection(currentWord, response.definitions, currentSentence);
    renderAudioButton();
    renderSentencesSection(currentWord);
    render(renderExternalLinks(currentWord), linksContainer);
    render(renderAiTab(currentWord, currentSentence, currentOpenAiKey, getDeckSelectionCallback(), aiResponseContainer), aiQuestionContainer);
    renderDeckSelector(currentAnkiDecks);
}

chrome.storage.session.get().then(items => {
    currentWord = items.word;
    currentSentence = items.sentence;
    currentForvoKey = items.forvoKey;
    currentOpenAiKey = items.openAiKey;
    setAnkiConnectKey(items.ankiConnectKey);
    updateWithCurrentWord();
});

chrome.storage.session.onChanged.addListener(async (changes) => {
    if (changes['forvoKey'] || changes['openAiKey'] || changes['ankiConnectKey']) {
        if (changes['forvoKey']) {
            currentForvoKey = changes['forvoKey'].newValue;
        }
        if (changes['openAiKey']) {
            currentOpenAiKey = changes['openAiKey'].newValue;
        }
        if (changes['ankiConnectKey']) {
            setAnkiConnectKey(changes['ankiConnectKey'].newValue);
        }
        return;
    }
    currentWord = changes['word'].newValue;
    // a different word chosen in the same sentence results in no change coming for key `sentence`.
    if (changes['sentence']) {
        currentSentence = changes['sentence'].newValue;
    }

    if (!currentWord) {
        return;
    }
    updateWithCurrentWord();
});

async function renderAudioButton() {
    // TODO: this clearing of state and re-rendering should just be replaced by actual components. It's time.
    render(html``, audioContainer);
    if (currentForvoKey) {
        const audioUrl = await callForvo(currentWord, currentForvoKey);
        if (!audioUrl) {
            return;
        }
        audioElement = document.createElement('audio');
        audioElement.crossOrigin = 'anonymous';
        audioElement.src = audioUrl;
        audioElement.load();
        render(html`<div class="sidepanel-information-message">Audio from <a href="https://forvo.com">Forvo</a>.</div>
            <button class="chinese-learning-extension-audio-button" @click=${playAudio}>Listen</button>
            <div>${getAnkiTemplate(currentWord, { audioUrl }, CardType.Audio, getDeckSelectionCallback())}</div>`, audioContainer);
        return;
    }
    render(html`<div class="sidepanel-information-message">Using computer audio.<br>To get human audio, enter a Forvo API key in
            <a class="chineselearningextension-external-link" @click=${function () {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options.html'));
            }
        }}>the options page</a>.</div><div class="audio-button-container"><button class="chinese-learning-extension-audio-button" @click=${playAudio}><span>&gt;</span></button> Play Audio</div>`, audioContainer);
}

function renderHeader(word) {
    render(html`<h1 class="chineselearningextension-side-panel-header">Learn More - ${word}</h1>`, mainHeaderContainer);
}

async function renderDefinitionsSection(word, definitions, sentence) {
    render(html``, definitionContainer);
    const dictionaryTemplate = getDictionaryTemplate(word, definitions, sentence);
    render(html`<div>${dictionaryTemplate}</div>
        <div>${getAnkiTemplate(word, { definitions }, CardType.Definition, getDeckSelectionCallback())}</div>`, definitionContainer);
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

async function renderSentencesSection(word) {
    render(html``, sentencesContainer);
    const sentencesTemplate = await getSentencesTemplate(word, getDeckSelectionCallback());
    render(sentencesTemplate, sentencesContainer);
}