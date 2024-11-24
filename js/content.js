import { pinyin } from "../data/definitions.js";
import { html, render } from 'lit-html';

let modifications = [];

const HAN_REGEX = /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FD5\uF900-\uFA6D\uFA70-\uFAD9]/;
function processNode(node) {
    if (node.nodeType === node.TEXT_NODE && node.textContent.match(HAN_REGEX)) {
        // will ordering just work?
        const parent = node.parentNode;
        const nextSibling = node.nextSibling;
        // making modifications here directly messes with forEach over childNodes below
        modifications.push({ node, parent, nextSibling });
        return;
    }
    //need iframe handling, ideally node type allowlist but that'll be rough
    if (node.nodeName !== "SCRIPT") {
        node.childNodes.forEach(x => processNode(x))
    }
}

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

const popover = document.createElement('div');
popover.classList.add('chineselearningextension-popover');
popover.popover = 'auto';
document.body.appendChild(popover);

function getToneColor(tone) {
    return tone === '1' ? '#eb3434' : tone === '2' ? 'green' : tone === '3' ? '#8f34eb' : tone === '4' ? '#345eeb' : '#333';
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

function renderDictionary(word, parsedDefinitions, container) {
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
    const template = html`<div>
            <h2 class="chineselearningextension-popover-header">${word}</h2>
        </div>
        <ul class="chineselearningextension-definitions">${itemTemplates}</ul>`;
    render(template, container);
}

// TODO: either add more fix-up logic (e.g., manually split 日出生 into [日,出生], or find other tokenizer)
function allHaveTones(word) {
    for (const character of word) {
        if (!pinyin[character]) {
            return false;
        }
    }
    return true;
}
function overrideTones(word) {
    let result = '';
    for (const character of word) {
        result += pinyin[character];
    }
    return result;
}

let pendingHideTimeout;
function triggerHidePopover() {
    if (pendingHideTimeout) {
        return;
    }
    pendingHideTimeout = setTimeout(function () {
        popover.hidePopover();
    }, 500);
}

function cancelHidePopover() {
    clearTimeout(pendingHideTimeout);
    pendingHideTimeout = null;
}

popover.addEventListener('mouseenter', function () {
    cancelHidePopover();
});
popover.addEventListener('mouseleave', function () {
    triggerHidePopover();
});

//need iframe handling
// to get background color: window.getComputedStyle(mod.node.parentElement).backgroundColor
document.body.childNodes.forEach(x => processNode(x));
modifications.forEach(mod => {
    mod.parent.removeChild(mod.node);
    const fullText = mod.node.textContent;
    const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
    const segments = segmenter.segment(fullText);
    // TODO: syntactic sugar
    Array.from(segments).forEach(segment => {
        let tones = pinyin[segment.segment];
        if (!tones && allHaveTones(segment.segment)) {
            tones = overrideTones(segment.segment);
        }
        const wrapper = document.createElement('span');
        if (tones) {
            let i = 0;
            // TODO: use lit templates
            for (const character of segment.segment) {
                const coloredSpan = document.createElement('span');
                coloredSpan.innerText = character;
                const tone = tones[i];
                coloredSpan.style.color = getToneColor(tone);
                wrapper.appendChild(coloredSpan);
                i++;
            }
            wrapper.addEventListener('mouseenter', async function () {
                const response = await chrome.runtime.sendMessage({ word: segment.segment });
                if (!response.definitions) {
                    return;
                }
                cancelHidePopover();
                const oldAnchors = document.getElementsByClassName('chineselearningextension-definition-anchor');
                Array.from(oldAnchors).forEach(element => element.classList.remove('chineselearningextension-definition-anchor'));
                wrapper.classList.add('chineselearningextension-definition-anchor');
                const parsedDefinitions = parseDefinitions(response.definitions);
                renderDictionary(segment.segment, parsedDefinitions, popover);
                popover.showPopover();
            });
            wrapper.addEventListener('mouseleave', function () {
                triggerHidePopover();
            });
            mod.parent.insertBefore(wrapper, mod.nextSibling);
        } else {
            wrapper.innerText = segment.segment;
            mod.parent.insertBefore(wrapper, mod.nextSibling);
        }
    });
})