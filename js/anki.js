import { html } from "lit-html"
import { parseDefinitions } from "./dictionary"

const ankiConnectBaseUrl = 'http://localhost:8765';

let existingAnkiCards = [];

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
        return [];
    }
}

async function fetchExistingCards() {
    try {
        // TODO: combine with callAnkiConnect
        const findNotesResponse = await fetch(ankiConnectBaseUrl, {
            body: JSON.stringify({
                "action": "findNotes",
                "version": 6,
                "params": {
                    "query": "tag:ChineseLearningExtension"
                }
            }), method: 'POST'
        });
        const responseJson = await findNotesResponse.json();
        const existingCardsFromExtension = responseJson.result;
        const noteInfoResponse = await fetch(ankiConnectBaseUrl, {
            body: JSON.stringify({
                "action": "notesInfo",
                "version": 6,
                "params": {
                    "notes": existingCardsFromExtension
                }
            }), method: 'POST'
        });
        const noteInfoResponseJson = await noteInfoResponse.json();
        existingAnkiCards = Object.fromEntries(noteInfoResponseJson.result.map(card => [card.fields.Front.value || card.fields.audio[0].filename, card.fields.Back.value]));
    } catch (x) {
        // no anki-connect? no ability to add flash cards, but that's ok
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
                    "fields": [
                        "Front"
                    ]
                }]
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
        // uh...
        return !!existingAnkiCards[`ChineseLearningExtension-${word}.mp3`];
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
                await makeAudioCard(word, cardRequest.audioUrl, deck);
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

export { getAnkiTemplate, fetchAnkiDecks, fetchExistingCards, CardType }