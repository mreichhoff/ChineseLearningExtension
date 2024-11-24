import { definitions } from "../data/definitions.js";

chrome.runtime.onMessage.addListener(
    async function (request, sender, sendResponse) {
        if (request.type === 'definitions') {
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