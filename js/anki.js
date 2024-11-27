import { html } from "lit-html"
import { parseDefinitions } from "./dictionary"

const ankiConnectBaseUrl = 'http://localhost:8765';

async function fetchAnkiDecks() {
    try {
        // TODO: combine with callAnkiConnect
        const ankiConnectResponse = await fetch(ankiConnectBaseUrl, {
            body: JSON.stringify({
                "action": "deckNamesAndIds",
                "version": 6
            }), method: 'POST'
        });
        const responseJson = await ankiConnectResponse.json();
        // TODO: what does the deck ID do? name appears used at least in addNote
        return Array.from(Object.entries(responseJson.result))
    } catch (x) {
        // no anki-connect? no ability to add flash cards, but that's ok
        console.log('error calling anki', x)
        return [];
    }
}

async function makeDefinitionCard(word, definitions, deck) {
    const parsedDefinitions = parseDefinitions(definitions);
    let cardAnswer = '';
    Object.entries(parsedDefinitions).forEach(([pinyin, definitions]) => {
        cardAnswer += `${pinyin}: `;
        definitions.forEach((definition, index) => {
            cardAnswer += `${index + 1}: ${definition.en} `
        });
    });
    const requestBody = {
        "action": "addNote",
        "version": 6,
        "params": {
            "note": {
                "deckName": deck,
                "modelName": "Basic",
                "fields": {
                    "Front": word,
                    "Back": cardAnswer
                },
                "options": {
                    "allowDuplicate": false,
                    "duplicateScope": "deck",
                    "duplicateScopeOptions": {
                        "deckName": deck,
                        "checkChildren": false,
                        "checkAllModels": false
                    }
                },
                "tags": [
                    "ChineseLearningExtension"
                ]
            }
        }
    };
    callAnkiConnect(requestBody);
}

async function makeAudioCard(word, audioUrl, deck) {
    const requestBody = {
        "action": "addNote",
        "version": 6,
        "params": {
            "note": {
                "deckName": deck,
                "modelName": "Basic",
                "fields": {
                    "Front": "",
                    "Back": word
                },
                "options": {
                    "allowDuplicate": false,
                    "duplicateScope": "deck",
                    "duplicateScopeOptions": {
                        "deckName": "Default",
                        "checkChildren": false,
                        "checkAllModels": false
                    }
                },
                "tags": [
                    "ChineseLearningExtension"
                ],
                "audio": [{
                    "url": audioUrl,
                    "filename": `ChineseLearningExtension-${word}.mp3`,
                    "skipHash": "7e2c2f954ef6051373ba916f000168dc",
                    "fields": [
                        "Front"
                    ]
                }]
            }
        }
    };
    callAnkiConnect(requestBody)
}

async function callAnkiConnect(request) {
    const ankiConnectResponse = await fetch(ankiConnectBaseUrl, {
        body: JSON.stringify(request),
        method: 'POST'
    });
    const json = await ankiConnectResponse.json();
    return json;
}

const CardType = {
    Audio: 'audio',
    Definition: 'definition'
};
async function getAnkiTemplate(word, cardRequest, cardType) {
    const ankiDecks = await fetchAnkiDecks();
    if (!ankiDecks || ankiDecks.length < 1) {
        return '';
    }
    const deckSelector = html`<label>Deck: <select>
        ${ankiDecks.map((deck) =>
        html`<option value="${deck[0]}">${deck[0]}</option>`)}
        </select></label>`;

    let disabled = false;
    return html`<div><div class="chineselearningextension-result-message"></div>
            ${deckSelector}
            <button @click=${async function (e) {
            if (disabled) {
                return;
            }
            disabled = true;
            const parent = e.target.parentNode;
            // TODO: we code good
            const deck = parent.querySelector('select').value;
            const statusElement = parent.querySelector('.chineselearningextension-result-message');
            try {
                if (cardType === CardType.Audio) {
                    await makeAudioCard(word, cardRequest.audioUrl, deck);
                } else if (cardType === CardType.Definition) {
                    await makeDefinitionCard(word, cardRequest.definitions, deck);
                }
                statusElement.innerText = `Successfully added ${word} ${cardType} to ${deck}.`;
                setTimeout(function () {
                    statusElement.innerText = '';
                    disabled = false
                }, 3000);
            } catch (e) {
                disabled = false;
                statusElement.innerText = `Oops, something went wrong.`;
            }
        }} class="chineselearningextension-anki-button">
                Add card
            </button>
    </div>`;
}

export { getAnkiTemplate, CardType }