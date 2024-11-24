import { definitions } from "../data/definitions.js";

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        sendResponse({ definitions: definitions[request.word] });
    }
);

chrome.runtime.onMessage.addListener((message, sender) => {
    // The callback for runtime.onMessage must return falsy if we're not sending a response
    (async () => {
        console.log(message);
        if (message.type === 'open_side_panel') {
            // This will open a tab-specific side panel only on the current tab.
            await chrome.sidePanel.open({ tabId: sender.tab.id });
            await chrome.sidePanel.setOptions({
                tabId: sender.tab.id,
                path: 'sidepanel-tab.html',
                enabled: true
            });
        }
    })();
});