import { html } from 'lit-html';

const linkSources = {
    Tatoeba: {
        linkTemplate: word => `https://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=${word}`,
        description: 'sentences'
    },
    HanziGraph: {
        linkTemplate: word => `https://hanzigraph.com/simplified/${word}`,
        description: 'data'
    },
    Wiktionary: {
        linkTemplate: word => `https://en.wiktionary.org/wiki/${word}`,
        description: 'definitions'
    },
    Youglish: {
        linkTemplate: word => `https://youglish.com/pronounce/${word}/chinese`,
        description: 'videos'
    },
    Forvo: {
        linkTemplate: word => `https://forvo.com/search/${word}/zh/`,
        description: 'pronunciation'
    }
}

function renderExternalLinks(word) {
    return html`<h3>External links for ${word}</h3>
    <ul class="chineselearningextension-link-list">${Object.entries(linkSources).map(([linkName, linkData]) => {
        return html`<li class="chineselearningextension-link-item">
        Get <span class="chineselearningextension-emphasized">${linkData.description}</span> on
        <a class="chineselearningextension-external-link" href="${linkData.linkTemplate(encodeURIComponent(word))}">${linkName}</a></li>`
    })}</ul>`;
}

export { renderExternalLinks }