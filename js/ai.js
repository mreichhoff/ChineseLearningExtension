import { render, html } from 'lit-html';

const chatEndpoint = 'https://api.openai.com/v1/chat/completions';

const cachedSentenceResponses = {};
const cachedWordResponses = {};
const spinner = document.getElementById('ai-loading-spinner');

async function explainSentence(sentence, key) {
    if (sentence in cachedSentenceResponses) {
        return cachedSentenceResponses[sentence];
    }
    const chatRequest = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful Chinese language teacher. Please output JSON."
            },
            {
                "role": "user",
                "content": `Please briefly explain, in English, the grammar of the sentence "${sentence}"`
            }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "sentence_explanation",
                "schema": {
                    "type": "object",
                    "properties": {
                        "grammar_points": {
                            "type": "array", "items": { "type": "string" }
                        },
                        "word_by_word": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "word": { "type": "string" },
                                    "meaning": { "type": "string" }
                                },
                                "required": ["word", "meaning"],
                                "additionalProperties": false
                            }
                        }
                    },
                    "required": ["grammar_points", "word_by_word"],
                    "additionalProperties": false
                },
                "strict": true
            }
        }
    }
    const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(chatRequest)
    });
    const responseJson = await response.json();
    // save quota, I guess
    cachedSentenceResponses[sentence] = responseJson;
    return responseJson;
}

async function explainWord(word, key) {
    if (word in cachedWordResponses) {
        return cachedWordResponses[word];
    }
    const chatRequest = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful Chinese language teacher. Please output JSON."
            },
            {
                "role": "user",
                "content": `Please briefly explain, in English, the use of "${word}", especially if there's any interesting grammar structures that use it.`
            }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "word_explanation",
                "schema": {
                    "type": "object",
                    "properties": {
                        "grammar_points": {
                            "type": "array", "items": { "type": "string" }
                        },
                        "usage": {
                            "type": "array", "items": { "type": "string" }
                        }
                    },
                    "required": ["grammar_points", "usage"],
                    "additionalProperties": false
                },
                "strict": true
            }
        }
    }
    const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(chatRequest)
    });
    const responseJson = await response.json();
    // save quota, I guess
    cachedWordResponses[word] = responseJson;
    return responseJson;
}

function getResponseString(aiResponse) {
    if (!aiResponse.choices || aiResponse.choices.length < 1 || !aiResponse.choices[0].message || !aiResponse.choices[0].message.content) {
        return 'ai says no';
    }
    console.log(aiResponse);
    return JSON.parse(aiResponse.choices[0].message.content);
}

function renderAiTab(word, sentence, key, responseContainer) {
    render(html``, responseContainer);
    if (!key) {
        return html`<div class="sidepanel-information-message">
            To use AI features, please add an API key in <a class="chineselearningextension-external-link" @click=${function () {
                if (chrome.runtime.openOptionsPage) {
                    chrome.runtime.openOptionsPage();
                } else {
                    window.open(chrome.runtime.getURL('options.html'));
                }
            }}>the options page</a>.</div>`;
    }
    return html`<div>
        <p class="sidepanel-information-message">You selected 
            <span class="chineselearningextension-emphasized">${word}</span>, found in the sentence 
            <span class="chineselearningextension-emphasized">${sentence}</span>
        </p>
        <p>
        <button class="chineselearningextension-button" @click=${async function () {
            spinner.removeAttribute('style');
            const aiResponse = await explainWord(word, key);
            const structuredResponse = getResponseString(aiResponse);
            render(html`<h3>Use of ${word}</h3>
                <ul class="explanation-list">${structuredResponse.usage.map(usage =>
                html`<li>
                    ${usage}
                </li>`)}</ul>
                <h3>Grammar Points</h3>
                <ul class="explanation-list">${structuredResponse.grammar_points.map(point =>
                    html`<li>${point}</li>`)}
                </ul>`, responseContainer);
            spinner.style.display = 'none';
        }}>AI Word Analysis</button>
        <button class="chineselearningextension-button float-right" @click=${async function (e) {
            spinner.removeAttribute('style');
            const aiResponse = await explainSentence(sentence, key);
            const structuredResponse = getResponseString(aiResponse);
            render(html`<h3>Word-by-word</h3>
            <ul class="explanation-list">${structuredResponse.word_by_word.map(wordExplanation =>
                html`<li>
                <span class="target-sentence">${wordExplanation.word}: </span><span class="translation">${wordExplanation.meaning}</span>
            </li>`)}</ul>
            <h3>Grammar Points</h3>
            <ul class="explanation-list">${structuredResponse.grammar_points.map(point =>
                    html`<li>${point}</li>`)}
            </ul>`, responseContainer);
            spinner.style.display = 'none';
        }}>AI Sentence Analysis</button></p></div>`;
}

export { renderAiTab }