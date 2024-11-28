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
        return html`Sorry, no sentences found.`
    }
    return html`${sentencesForWord.map((sentence, index) =>
        html`<div><div class="example-sentence">
            <p class="target-sentence">${sentence.zh.join('')}</p>
            <p class="pinyin">${sentence.pinyin}</p>
            <p class="translation">${sentence.en}</p>
        </div>
        ${getAnkiTemplate(word, { sentence }, CardType.Sentence, deckSelectionCallback)}</div>`
    )}`;
}

export { getSentencesTemplate }