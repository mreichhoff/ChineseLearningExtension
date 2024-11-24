import { pinyin } from "../data/definitions.js";

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

const popover = document.createElement('div');
popover.popover = 'auto';
document.body.appendChild(popover);

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
        const tones = pinyin[segment.segment];
        if (tones) {
            let i = 0;
            const wrapper = document.createElement('span');
            for (const character of segment.segment) {
                const coloredSpan = document.createElement('span');
                coloredSpan.innerText = character;
                coloredSpan.addEventListener('mouseover', async function () {
                    const response = await chrome.runtime.sendMessage({ word: segment.segment });
                    if (!response.definitions) {
                        return;
                    }
                    response.definitions.forEach(definition => {
                        const definitionDiv = document.createElement('div');
                        definitionDiv.innerHTML = `${definition.pinyin}: ${definition.en}`;
                        popover.appendChild(definitionDiv);
                    });
                    popover.showPopover();
                });
                coloredSpan.addEventListener('mouseout', function () {
                    popover.innerHTML = '';
                    popover.hidePopover();
                });
                const tone = tones[i];
                coloredSpan.style.color = tone === '1' ? '#eb3434' : tone === '2' ? 'green' : tone === '3' ? '#8f34eb' : tone === '4' ? '#345eeb' : '#333';
                wrapper.appendChild(coloredSpan);
                i++;
            }
            mod.parent.insertBefore(wrapper, mod.nextSibling);
        }
    });
})