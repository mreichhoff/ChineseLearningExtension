let definitions;

async function loadDefinitions() {
    const definitionsFile = await fetch(chrome.runtime.getURL('data/definitions.json'));
    definitions = await definitionsFile.json();
}

chrome.runtime.onInstalled.addListener(async function () {
    await loadDefinitions();
});

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
        if (request.type === 'definitions') {
            if (!definitions) {
                // should be loaded by install listener, but just in case, I guess?
                await loadDefinitions();
            }
            sendResponse({ definitions: definitions[request.word] });
        } else if (request.type === 'open-learn-more') {
            chrome.storage.session.set({ word: request.word });
            // This will open a tab-specific side panel only on the current tab.
            await chrome.sidePanel.open({ tabId: sender.tab.id });
            await chrome.sidePanel.setOptions({
                tabId: sender.tab.id,
                path: 'side-panel.html',
                enabled: true
            });
        }
    }
);