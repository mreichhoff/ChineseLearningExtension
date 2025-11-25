import { fetchAnkiDecks, fetchExistingCards, setAnkiConnectKey, requestPermission } from "./anki";

const integrationsForm = document.getElementById('integration-options');
// const forvoField = document.getElementById('forvo-api-key');
const openAiField = document.getElementById('openai-api-key');
const resultMessage = document.getElementById('result-message');

const ankiConnectField = document.getElementById('anki-connect-info');
const ankiConnectStatusCheckButton = document.getElementById('check-anki-connect-status');
const ankiConnectKeyInput = document.getElementById('anki-connect-key');

const popoverDelayField = document.getElementById('popover-delay');
const immersionModeCheckbox = document.getElementById('immersion-mode');

integrationsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    setAnkiConnectKey(ankiConnectKeyInput.value);
    const sensitiveData = {
        /*'forvoKey': forvoField.value,*/
        'openAiKey': openAiField.value,
        'ankiConnectKey': ankiConnectKeyInput.value
    };
    const nonsensitiveData = {
        'popoverDelay': parseInt(popoverDelayField.value),
        'immersionMode': immersionModeCheckbox.checked,
    };

    Promise.all([
        chrome.storage.session.set(sensitiveData), // chrome.storage.session for sensitive data like API keys. (https://developer.chrome.com/docs/extensions/reference/api/storage)
        chrome.storage.sync.set(nonsensitiveData), // chrome.storage.sync for nonsensitive data.
    ]).then(() => {
        resultMessage.innerText = "Successfully saved.";
        setTimeout(() => {
            resultMessage.innerText = '';
        }, 3000);
    }).catch((err) => {
        resultMessage.innerText = "Error saving settings: " + err;
    });
});

// Load the current options.
chrome.storage.session.get().then(items => {
    if (!items.openAiKey && !items.ankiConnectKey) {
        renderAnkiConnectStatus();
        return;
    }
    openAiField.value = items.openAiKey || '';
    ankiConnectKeyInput.value = items.ankiConnectKey || '';
    setAnkiConnectKey(items.ankiConnectKey);
    renderAnkiConnectStatus();
});

chrome.storage.sync.get().then(items => {
    popoverDelayField.value = items.popoverDelay || 500;
    immersionModeCheckbox.checked = items.immersionMode || false;
})

async function renderAnkiConnectStatus() {
    const permissionResult = await requestPermission();
    if (!permissionResult || permissionResult.permission === 'denied') {
        ankiConnectField.innerText = `Could not reach AnkiConnect. You may need to install it or grant permissions.`;
        // i know i shouldn't
        ankiConnectField.style.border = '4px solid #ff635f';
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
        ankiConnectField.style.border = '4px solid #66c42b';
    } else {
        ankiConnectField.innerText = `Either could not reach AnkiConnect, or no decks found. See above for instructions.`;
        ankiConnectField.style.border = '4px solid #ff635f';
    }
}

ankiConnectStatusCheckButton.addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    await chrome.storage.session.set({
        'ankiConnectKey': ankiConnectKeyInput.value
    });
    setAnkiConnectKey(ankiConnectKeyInput.value);
    await renderAnkiConnectStatus();
});