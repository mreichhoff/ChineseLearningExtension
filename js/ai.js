import { render, html } from 'lit-html';

const chatEndpoint = 'https://api.openai.com/v1/chat/completions';

const cachedSentenceResponses = {};

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
                "content": `Please briefly explain the grammar of the sentence "${sentence}"`
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

function getResponseString(aiResponse) {
    if (!aiResponse.choices || aiResponse.choices.length < 1 || !aiResponse.choices[0].message || !aiResponse.choices[0].message.content) {
        return 'ai says no';
    }
    console.log(aiResponse);
    return JSON.parse(aiResponse.choices[0].message.content);
}

function renderAiTab(word, sentence, key) {
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
    return html`<div></div><div><button @click=${async function (event) {
        const aiResponse = await explainSentence(sentence, key);
        // lol
        const messageContainer = event.target.parentNode.previousSibling;
        const structuredResponse = getResponseString(aiResponse);
        render(html`<h3>Word-by-word</h3>
            <ul>${structuredResponse.word_by_word.map(wordExplanation =>
            html`<li>
                <span>${wordExplanation.word}: </span><span>${wordExplanation.meaning}</span>
            </li>`)}</ul>
            <h3>Grammar Points</h3>
            <ul>${structuredResponse.grammar_points.map(point =>
                html`<li>${point}</li>`)}
            </ul>`, messageContainer);
    }}>Ask an AI</button></div>`;
}

export { renderAiTab }