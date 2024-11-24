import { definitions } from "../data/definitions.js";

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        sendResponse({ definitions: definitions[request.word] });
    }
);