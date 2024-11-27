import { html, render } from 'lit-html';

function parseDefinitions(definitionList) {
    let parsedDefinitions = {};
    for (const item of definitionList) {
        // TODO: I goofed...
        // definitions format should be:
        // key: word (or character)
        // val: [{pinyin: a, definitions: [a,b,c], measure: [a,b,c]}...]
        // this would better match cedict's format
        // could consider combining simplified and trad, but separating for
        // the purpose of sentences seems better
        // should also verify this format...
        const key = item.pinyin;
        if (!(key in parsedDefinitions)) {
            parsedDefinitions[key] = [item];
        } else {
            parsedDefinitions[key].push(item);
        }
    }
    return parsedDefinitions;
}

function getToneColor(tone) {
    return tone === '1' ? '#eb3434' : tone === '2' ? 'green' : tone === '3' ? '#8f34eb' : tone === '4' ? '#68aaee' : '#333';
}

function renderPinyin(pinyin) {
    const pinyinTemplates = [];
    const syllables = pinyin.split(' ');
    syllables.forEach(syllable => {
        pinyinTemplates.push(
            html`<span class="chineselearningextension-definition-pinyin" style="color:${getToneColor(syllable[syllable.length - 1])}">
                ${syllable}
            </span>`
        );
    });
    return pinyinTemplates;
}

function renderDefinitions(definitions) {
    const definitionTemplates = [];
    definitions.forEach((definition, index) => {
        definitionTemplates.push(
            html`<span>
                <span class="chineselearningextension-definition-number">${index + 1}:</span>
                <span>${definition.en}</span>
            </span>`
        );
    });
    return definitionTemplates;
}

// TODO: make more generic, no popover or side-panel specifics
function getDictionaryTemplate(word, definitions, callback) {
    const parsedDefinitions = parseDefinitions(definitions);
    const itemTemplates = [];
    Object.entries(parsedDefinitions).forEach(([pinyin, definitions]) => {
        const pinyinTemplates = renderPinyin(pinyin);
        const definitionTemplates = renderDefinitions(definitions);
        itemTemplates.push(
            html`<li class="chineselearningextension-definition-item">
                ${pinyinTemplates}
                ${definitionTemplates}
            </li>`);
    });
    const button = callback ? html`<button @click=${function () { callback(word) }} class="chineselearningextension-learn-more-button">
        Learn More
    </button>` : ``;
    const template = html`<div>
            <h2 class="chineselearningextension-popover-header">
                ${word}
                ${button}
            </h2>
        </div>
        <ul class="chineselearningextension-definitions">${itemTemplates}</ul>`;
    return template;
}

export { getDictionaryTemplate, parseDefinitions }