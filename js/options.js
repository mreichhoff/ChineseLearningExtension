import { fetchAnkiDecks, fetchExistingCards, setAnkiConnectKey, requestPermission } from "./anki";

const integrationsForm = document.getElementById('integration-options');
// const forvoField = document.getElementById('forvo-api-key');
const openAiField = document.getElementById('openai-api-key');
const resultMessage = document.getElementById('result-message');

const ankiConnectField = document.getElementById('anki-connect-info');
const ankiConnectStatusCheckButton = document.getElementById('check-anki-connect-status');
const ankiConnectKeyInput = document.getElementById('anki-connect-key');

integrationsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setAnkiConnectKey(ankiConnectKeyInput.value);
    chrome.storage.session.set({
        /*'forvoKey': forvoField.value,*/
        'openAiKey': openAiField.value,
        'ankiConnectKey': ankiConnectKeyInput.value
    }).then(() => {
        resultMessage.innerText = "Successfully saved.";
        setTimeout(() => {
            resultMessage.innerText = '';
        }, 3000);
    });
});

chrome.storage.session.get().then(items => {
    if (!items.openAiKey && !items.ankiConnectKey) {
        renderAnkiConnectStatus();
        return;
    }
    openAiField.value = items.openAiKey;
    ankiConnectKeyInput.value = items.ankiConnectKey;
    setAnkiConnectKey(items.ankiConnectKey);
    renderAnkiConnectStatus();
});

async function renderAnkiConnectStatus() {
    const permissionResult = await requestPermission();
    if (!permissionResult || permissionResult.permission === 'denied') {
        ankiConnectField.innerText = `Could not reach AnkiConnect. You may need to install it or grant permissions.`;
        return;
    }
    if (permissionResult.requireApikey) {
        Array.from(document.getElementsByClassName('anki-connect-key')).forEach(keyElement => keyElement.removeAttribute('style'))
    } else {
        // we don't need the key, and seemingly including one in that case causes problems...
        Array.from(document.getElementsByClassName('anki-connect-key')).forEach(keyElement => keyElement.style.display = 'none');
        chrome.storage.session.remove('ankiConnectKey');
        setAnkiConnectKey(undefined);
    }
    const decks = await fetchAnkiDecks();
    if (decks.length != 0) {
        const existingCards = await fetchExistingCards();
        ankiConnectField.innerText = `Successfully connected to AnkiConnect.
        Found ${decks.length} existing decks, and ${Object.entries(existingCards).length} cards created by ChineseLearningExtension.`;
    } else {
        ankiConnectField.innerText = `Either could not reach AnkiConnect, or no decks found. See above for instructions.`;
    }
}

ankiConnectStatusCheckButton.addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    setAnkiConnectKey(ankiConnectKeyInput.value);
    await renderAnkiConnectStatus();
});