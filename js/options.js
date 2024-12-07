import { fetchAnkiDecks, fetchExistingCards } from "./anki";

const integrationsForm = document.getElementById('integration-options');
// const forvoField = document.getElementById('forvo-api-key');
const openAiField = document.getElementById('openai-api-key');
const resultMessage = document.getElementById('result-message');

const ankiConnectField = document.getElementById('anki-connect-info');
const ankiConnectStatusCheckButton = document.getElementById('check-anki-connect-status');

integrationsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    chrome.storage.session.set({ /*'forvoKey': forvoField.value,*/ 'openAiKey': openAiField.value }).then(() => {
        resultMessage.innerText = "Successfully saved.";
        setTimeout(() => {
            resultMessage.innerText = '';
        }, 3000);
    });
});

chrome.storage.session.get().then(items => {
    if (!items.openAiKey) {
        return;
    }
    openAiField.value = items.openAiKey;
});

async function renderAnkiConnectStatus() {
    const decks = await fetchAnkiDecks();
    if (decks.length != 0) {
        const existingCards = await fetchExistingCards();
        ankiConnectField.innerText = `Successfully connected to AnkiConnect. Found ${decks.length} existing decks,
        and ${Object.entries(existingCards).length} cards created by ChineseLearningExtension.`;
    } else {
        ankiConnectField.innerText = `Either could not reach AnkiConnect, or no decks found. See above for instructions.`;
    }
}

renderAnkiConnectStatus();
ankiConnectStatusCheckButton.addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    await renderAnkiConnectStatus();
});