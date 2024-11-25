const integrationsForm = document.getElementById('integration-options');
const forvoField = document.getElementById('forvo-api-key');
const resultMessage = document.getElementById('result-message');

integrationsForm.addEventListener('submit', function (e) {
    e.preventDefault();
    chrome.storage.session.set({ 'forvoKey': forvoField.value }).then(() => {
        resultMessage.innerText = "Successfully saved.";
        setTimeout(() => {
            resultMessage.innerText = '';
        }, 3000);
    });
});