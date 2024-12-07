import { html } from 'lit-html';
import { getAnkiTemplate, CardType } from './anki';

let sentences;

async function loadSentences() {
    const sentencesFile = await fetch(chrome.runtime.getURL('data/sentences.json'));
    sentences = await sentencesFile.json();
}

async function getSentences(word) {
    if (!sentences) {
        await loadSentences();
    }
    return sentences[word] || [];
}

async function getSentencesTemplate(word, deckSelectionCallback) {
    const sentencesForWord = await getSentences(word);
    if (!sentencesForWord || sentencesForWord.length === 0) {
        return html`<div class="sidepanel-information-message">Sorry, no sentences found.</div>`
    }
    return html`<div class="sidepanel-information-message">Example sentences from
        <a class="chineselearningextension-external-link" href="https://tatoeba.org">Tatoeba</a>
    </div>
    <ol class="example-sentence-list">
    ${sentencesForWord.map((sentence, index) =>
        html`<li class="example-sentence-item"><div class="example-sentence">
            <p class="target-sentence">${sentence.zh.join('')}</p>
            <p class="pinyin">${sentence.pinyin}</p>
            <p class="translation">${sentence.en}</p>
        </div>
        ${getAnkiTemplate(word, { sentence }, CardType.Sentence, deckSelectionCallback)}</li></ol>`
    )}`;
}

export { getSentencesTemplate }