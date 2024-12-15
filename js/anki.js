import { html } from "lit-html"
import { parseDefinitions } from "./dictionary"

const ankiConnectBaseUrl = 'http://localhost:8765';

let existingAnkiCards = [];
let ankiConnectKey;

async function requestPermission() {
    try {
        const ankiConnectResponse = await fetch(ankiConnectBaseUrl, {
            body: JSON.stringify({
                "action": "requestPermission",
                "version": 6
            }), method: 'POST'
        });
        const responseJson = await ankiConnectResponse.json();
        return responseJson.result;
    } catch (x) {
        // no anki-connect? no ability to add flash cards, but that's ok
        return false;
    }
}

async function fetchAnkiDecks() {
    let request = {
        "action": "deckNamesAndIds",
        "version": 6
    }
    maybeAddAnkiConnectKey(request);
    try {
        // TODO: combine with callAnkiConnect
        const ankiConnectResponse = await fetch(ankiConnectBaseUrl, {
            body: JSON.stringify(request), method: 'POST'
        });
        const responseJson = await ankiConnectResponse.json();
        // TODO: what does the deck ID do? name appears used at least in addNote
        return Array.from(Object.entries(responseJson.result))
    } catch (x) {
        // no anki-connect? no ability to add flash cards, but that's ok
        return [];
    }
}

function maybeAddAnkiConnectKey(request) {
    if (ankiConnectKey) {
        request['key'] = ankiConnectKey;
    }
}

async function fetchExistingCards() {
    let notesRequest = {
        "action": "findNotes",
        "version": 6,
        "params": {
            "query": "tag:ChineseLearningExtension"
        }
    };
    maybeAddAnkiConnectKey(notesRequest);
    try {
        // TODO: combine with callAnkiConnect
        const findNotesResponse = await fetch(ankiConnectBaseUrl, {
            body: JSON.stringify(notesRequest), method: 'POST'
        });
        const responseJson = await findNotesResponse.json();
        const existingCardsFromExtension = responseJson.result;
        let noteInfoRequest = {
            "action": "notesInfo",
            "version": 6,
            "params": {
                "notes": existingCardsFromExtension
            }
        };
        maybeAddAnkiConnectKey(noteInfoRequest);
        const noteInfoResponse = await fetch(ankiConnectBaseUrl, {
            body: JSON.stringify(noteInfoRequest), method: 'POST'
        });
        const noteInfoResponseJson = await noteInfoResponse.json();
        existingAnkiCards = Object.fromEntries(noteInfoResponseJson.result.map(card => [card.fields.Front.value, card.fields.Back.value]));
        // TODO hydrate and also return....probably not great
        return existingAnkiCards;
    } catch (x) {
        // no anki-connect? no ability to add flash cards, but that's ok
        return {};
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

// google AI spit this out, it has to be right
function hashText(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

async function makeAudioCard(text, cardRequest, deck) {
    const textHash = hashText(text);
    const audioArray = [
        (cardRequest.audioUrl ? {
            "url": audioUrl,
            "filename": `ChineseLearningExtension-${textHash}.mp3`,
            "fields": [
                "Front"
            ]
        } : {
            "data": cardRequest.audioData,
            "filename": `ChineseLearningExtension-${textHash}.mp3`,
            "fields": [
                "Front"
            ]
        })
    ];
    const requestBody = {
        "action": "addNote",
        "version": 6,
        "params": {
            "note": {
                "deckName": deck,
                "modelName": "Basic",
                "fields": {
                    "Front": "",
                    "Back": text
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
                "audio": audioArray
            }
        }
    };
    callAnkiConnect(requestBody);
}

async function makeSentenceCard(word, sentence, deck) {
    const requestBody = {
        "action": "addNote",
        "version": 6,
        "params": {
            "note": {
                "deckName": deck,
                "modelName": "Basic",
                "fields": {
                    "Front": sentence.zh.join(''),
                    "Back": `${sentence.en} (${sentence.pinyin}); example of ${word}`
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

async function callAnkiConnect(request) {
    maybeAddAnkiConnectKey(request);
    const ankiConnectResponse = await fetch(ankiConnectBaseUrl, {
        body: JSON.stringify(request),
        method: 'POST'
    });
    const json = await ankiConnectResponse.json();
    return json;
}

const CardType = {
    Audio: 'audio',
    Definition: 'definition',
    Sentence: 'sentence'
};

function hasExistingCard(word, cardRequest, cardType) {
    if (cardType === CardType.Audio) {
        const hashedAudioText = hashText(word);
        // uh...
        return !!existingAnkiCards[`[sound:ChineseLearningExtension-${hashedAudioText}.mp3]`];
    }
    if (cardType === CardType.Definition) {
        return !!existingAnkiCards[word];
    }
    if (cardType === CardType.Sentence) {
        return !!existingAnkiCards[cardRequest.sentence.zh.join('')]
    }
}

function getAnkiTemplate(word, cardRequest, cardType, deckSelectionCallback) {
    if (!deckSelectionCallback) {
        return '';
    }
    let disabled = false;
    return html`<div class="anki-section"><p class="anki-section-header">${hasExistingCard(word, cardRequest, cardType) ? html`Added to Anki` : html`<button @click=${async function (e) {
        if (disabled) {
            return;
        }
        disabled = true;
        // TODO: we code good
        const ankiParagraph = e.target.parentNode;
        const deck = deckSelectionCallback();
        try {
            if (cardType === CardType.Audio) {
                await makeAudioCard(word, cardRequest, deck);
            } else if (cardType === CardType.Definition) {
                await makeDefinitionCard(word, cardRequest.definitions, deck);
            } else if (cardType === CardType.Sentence) {
                await makeSentenceCard(word, cardRequest.sentence, deck);
            }
            ankiParagraph.innerText = 'Added to Anki';
        } catch (e) {
            disabled = false;
        }
    }} class="chineselearningextension-add-card-button">
                +
            </button> Add ${cardType} to Anki?`}</p>
    </div>`;
}

function setAnkiConnectKey(key) {
    ankiConnectKey = key;
}

export { requestPermission, setAnkiConnectKey, getAnkiTemplate, fetchAnkiDecks, fetchExistingCards, CardType }