import { html } from 'lit-html';

const linkSources = [
    {
        name: 'Youglish',
        linkTemplate: word => `https://youglish.com/pronounce/${word}/chinese`,
        description: 'videos'
    },
    {
        name: 'Forvo',
        linkTemplate: word => `https://forvo.com/search/${word}/zh/`,
        description: 'pronunciation'
    },
    {
        name: 'HanziGraph',
        linkTemplate: word => `https://hanzigraph.com/simplified/${word}`,
        description: 'data'
    },
    {
        name: 'Wiktionary',
        linkTemplate: word => `https://en.wiktionary.org/wiki/${word}`,
        description: 'definitions'
    },
    {
        name: 'Tatoeba',
        linkTemplate: word => `https://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=${word}`,
        description: 'sentences'
    },
];

function renderExternalLinks(word) {
    return html`<h3>External links for ${word}</h3>
    <ul class="chineselearningextension-link-list">${linkSources.map(linkData => {
        return html`<li class="chineselearningextension-link-item">
        Get <span class="chineselearningextension-emphasized">${linkData.description}</span> on
        <a target="_blank" class="chineselearningextension-external-link" href="${linkData.linkTemplate(encodeURIComponent(word))}">${linkData.name}</a></li>`
    })}</ul>`;
}

export { renderExternalLinks }