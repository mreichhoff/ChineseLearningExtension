# Privacy Policy

See [the Chrome Web Store requirements](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq#ques_14).

The only personal data used by this extension is an API key you can optionally provide to get AI analysis
of words or sentences you encounter while browsing.

The extension author does *not* collect any data. The API key,
if you choose to enter it, is stored locally in [Chrome's extension session storage](https://developer.chrome.com/docs/extensions/reference/api/storage#property-session). It is used only to authenticate you to OpenAI, with standard HTTPS encryption, when you
choose the "Analyze Word", "Analyze Sentence", or "Pronounce Sentence" buttons. More information about their data
handling and API key best practices is available in [their API documentation](https://platform.openai.com/docs/overview).

No other party receives that key or other information as part of your use of the extension. All other functionality
is run locally, and no account is required to use the extension.

The Anki Connect integration can also result in cards you choose to make being added to Anki, which has sync functionality,
but that is also optional and outside the scope of the extension's functionality. No Anki Connect data is collected, and only
their default localhost URL and port (8765) are supported.
