import { pinyin } from "../data/pinyin.js";
import { html, render } from 'lit-html';
import { getDictionaryTemplate, getToneColor } from "./dictionary.js"

const PROCESSED_CLASS = 'chineselearningextension-processed';
const HAN_REGEX = /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FD5\uF900-\uFA6D\uFA70-\uFAD9]/;
const wordSegmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
const sentenceSegmenter = new Intl.Segmenter("zh-CN", { granularity: "sentence" });
let popover;
let observer;

function processNode(node, modifications) {
    if (node.classList && node.classList.contains(PROCESSED_CLASS)) {
        return;
    }
    if (node === popover) {
        return;
    }
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
        node.childNodes.forEach(x => processNode(x, modifications))
    }
}

function openSidePanel(word, sentence) {
    chrome.runtime.sendMessage({ type: 'open-learn-more', word, sentence });
}

// oh no, what have i done
function hackAroundDictionaryTokenizerMismatch(segments) {
    let result = [];
    Array.from(segments).forEach(segmentObj => {
        const segment = segmentObj.segment;
        if (segment in pinyin) {
            result.push(segment);
            return;
        }
        if (segment.length === 2) {
            if (segment[0] in pinyin && segment[1] in pinyin) {
                result.push(segment[0]);
                result.push(segment[1]);
                return;
            }
        }
        if (segment.length === 3) {
            let first = segment[0];
            let last = segment.substring(1);
            if (first in pinyin && last in pinyin) {
                result.push(first);
                result.push(last);
                return;
            }
            first = segment.substring(0, 2);
            last = segment.substring(2);
            if (first in pinyin && last in pinyin) {
                result.push(first);
                result.push(last);
                return;
            }
            if (segment[0] in pinyin && segment[1] in pinyin && segment[2] in pinyin) {
                result.push(segment[0]);
                result.push(segment[1]);
                result.push(segment[2]);
                return;
            }
        }
        if (segment.length === 4) {
            let first = segment.substring(0, 2);
            let last = segment.substring(2);
            if (first in pinyin && last in pinyin) {
                result.push(first);
                result.push(last);
                return;
            }
            if (segment[0] in pinyin && segment[1] in pinyin && segment[2] in pinyin && segment[3] in pinyin) {
                result.push(segment[0]);
                result.push(segment[1]);
                result.push(segment[2]);
                result.push(segment[3]);
                return;
            }
        }
        // if we've reached this point, there's not a clear fixup. Just add the segment.
        result.push(segment);
    });
    return result;
}
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

// TODO: sentence segmenter treats these weird in chinese...
function stripTokenizerArtifacts(sentence) {
    return sentence.replace(/《$/, '').replace(/^》/, '');
}

function addTones() {
    let modifications = [];
    //need iframe handling
    // to get background color: window.getComputedStyle(mod.node.parentElement).backgroundColor
    document.body.childNodes.forEach(x => processNode(x, modifications));
    modifications.forEach(mod => {
        mod.parent.removeChild(mod.node);
        const fullText = mod.node.textContent;

        const segments = wordSegmenter.segment(fullText);
        const sentences = Array.from(sentenceSegmenter.segment(fullText));
        const segmentsAdjustedForDictionary = hackAroundDictionaryTokenizerMismatch(segments);
        // TODO: syntactic sugar
        let totalLengthTraversed = 0;
        let sentenceIndex = 0;
        segmentsAdjustedForDictionary.forEach(segment => {
            if (totalLengthTraversed >= (sentences[sentenceIndex].index + sentences[sentenceIndex].segment.length)) {
                sentenceIndex++;
            }
            const sentence = stripTokenizerArtifacts(sentences[sentenceIndex].segment);
            //str.replace(/!$/, "");
            totalLengthTraversed += segment.length;
            let tones = pinyin[segment];
            if (!tones && allHaveTones(segment)) {
                tones = overrideTones(segment);
            }
            const wrapper = document.createElement('span');
            wrapper.classList.add(PROCESSED_CLASS);
            if (tones) {
                let i = 0;
                // TODO: use lit templates
                for (const character of segment) {
                    const coloredSpan = document.createElement('span');
                    coloredSpan.innerText = character;
                    const tone = tones[i];
                    coloredSpan.style.color = getToneColor(tone);
                    wrapper.appendChild(coloredSpan);
                    i++;
                }
                wrapper.addEventListener('mouseenter', async function () {
                    const response = await chrome.runtime.sendMessage({ type: 'definitions', word: segment });
                    // unclear in what cases response is null or undefined, but it does happen. Being defensive.
                    if (!response || !response.definitions) {
                        return;
                    }
                    cancelHidePopover();
                    const boundingBox = wrapper.getBoundingClientRect();
                    popover.style.left = `${Math.max(boundingBox.left + window.scrollX - 50, 0)}px`;
                    popover.style.top = `${boundingBox.bottom + window.scrollY}px`;
                    render(getDictionaryTemplate(segment, response.definitions, sentence, openSidePanel), popover);
                    popover.showPopover();
                });
                wrapper.addEventListener('mouseleave', function () {
                    triggerHidePopover();
                });
                mod.parent.insertBefore(wrapper, mod.nextSibling);
            } else {
                wrapper.innerText = segment;
                mod.parent.insertBefore(wrapper, mod.nextSibling);
            }
        });
    });
}

// if the popover has already been added, no-op.
if (document.getElementsByClassName('chineselearningextension-popover').length === 0) {
    popover = document.createElement('div');
    popover.classList.add('chineselearningextension-popover');
    popover.popover = 'auto';
    document.body.appendChild(popover);

    popover.addEventListener('mouseenter', function () {
        cancelHidePopover();
    });
    popover.addEventListener('mouseleave', function () {
        triggerHidePopover();
    });
    addTones();

    const mutationConfig = { childList: true, subtree: true };

    // Create an observer instance linked to the callback function
    observer = new MutationObserver(addTones);

    // Start observing the target node for configured mutations
    observer.observe(document.body, mutationConfig);
}