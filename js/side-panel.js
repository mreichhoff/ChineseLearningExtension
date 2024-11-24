import { html, render } from 'lit-html';
import { renderDictionary } from './dictionary';

const container = document.getElementById('chineselearningextension-side-panel-container');

chrome.storage.session.get('word', async ({ word }) => {
    const response = await chrome.runtime.sendMessage({ type: 'definitions', word });
    if (!response.definitions) {
        return;
    }
    renderDictionary(word, response.definitions, container);
});

chrome.storage.session.onChanged.addListener((changes) => {
    const newWord = changes['word'];

    if (!newWord) {
        return;
    }
    renderDictionary(newWord, response.definitions, container);
});