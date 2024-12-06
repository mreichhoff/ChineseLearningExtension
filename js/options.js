const integrationsForm = document.getElementById('integration-options');
// const forvoField = document.getElementById('forvo-api-key');
const openAiField = document.getElementById('openai-api-key');
const resultMessage = document.getElementById('result-message');

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