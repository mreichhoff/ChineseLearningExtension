# ChineseLearningExtension

A Chrome extension for learners of the Chinese language. Provides tone color coding, a pop-up dictionary, word definitions, example sentences, useful links, and AI analysis on any sentence on any web page. Also integrated with [Anki](https://apps.ankiweb.net/) to support one-click flashcard creation for new words, sentences, or pronunciations.

## Demo

```
git clone git@github.com:mreichhoff/ChineseLearningExtension.git
cd ChineseLearningExtension
npm install
npm run build
# Open chrome://extensions/
# Enable "Developer mode" (toggle in top right)
# "Load unpacked"
# Select the ChineseLearningExtension folder
```


https://github.com/user-attachments/assets/4e88c9bf-3e78-4682-ae68-4926a35d7586

## Installation
```

## Features

* Color codes characters by tone, with tokenization via the web platform's [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) library. Available on-demand on any site.
* Provides a popup dictionary for easy lookups of unknown words, using CEDICT and [the popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API).
* To provide more information about a word or sentence, provides a side panel with:
  * More details on definitions
  * Example sentences from Tatoeba
  * Useful links to [Forvo](https://forvo.com/), [Youglish](https://youglish.com/), [HanziGraph](https://hanzigraph.com), and more.
  * Optionally allows for sentence and word analysis with [OpenAI API](https://platform.openai.com/docs/overview) integration (bring-your-own-key).
  * [AnkiConnect](https://foosoft.net/projects/anki-connect/) integration: just one click to add a flash card for definitions, example sentences, or audio cards to improve listening comprehension.

## Integrations

### Anki Connect

Anki connect integration is supported. Setup is described [on their site](https://foosoft.net/projects/anki-connect/). 

Only the default settings are supported for now (no API key requirement, their standard URL, etc.).

The user's list of decks are read and words, sentences, and pronunciations can be added to any of them.

All cards created by the extension are tagged for easy management. To query them, simply run:
`tag:ChineseLearningExtension` in Anki's card browser.

Better card formatting, and more sophistication with other media types and AI output, is a potential future work item.

### OpenAI

The extension can optionally integrate with OpenAI's API to get word analysis, sentence analysis, and pronunciation.

Although I prefer human-generated content whenever possible, AI provides more flexibility, and its grammar and meaning analysis is often helpful.

[Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) are used to ensure nice formatting and coverage of certain topics,
though the prompts will continue to be refined. `gpt-4o` is used for text output, and `tts-1` with the `nova` voice for TTS.

### Forvo

A prior version of the code had Forvo API integration, again with a bring-your-own-key model,
such that human pronunciation could be optionally retrieved and saved in flashcards. Unfortunately, they no longer return CORS headers.

A future work item could be to query a local proxy instead of their API directly. For now, AI voices have replaced it.
 
## More Demos and Screenshots

### Example Use

Can be used to aid learning on sites like baike.baidu.com:

<img width="838" alt="baidu-baike" src="https://github.com/user-attachments/assets/afbfaae4-cfb9-44c5-a4d8-8f52fab90f84">

### AI Analysis

AI can provide word-by-word sentence breakdowns, discuss grammar, give usage clues, and more.

https://github.com/user-attachments/assets/07ee445e-9e1e-4dfc-9452-3f0d811de85b

### Distinguishing Similar Characters

Taken from a recent reddit post; tone colors help:

<img width="757" alt="similar-characters-demystified" src="https://github.com/user-attachments/assets/7f10036b-6022-4c0e-81d4-c3e1b4ec14d5">

### Audio Flashcard Example

One click to get audio into anki (same with definitions and example sentences):

<img width="628" alt="audio-flashcard" src="https://github.com/user-attachments/assets/6b4c7250-b591-4966-b083-8fce23546f2d">

### Light Mode

For those who prefer light mode:

<img width="1511" alt="light-mode" src="https://github.com/user-attachments/assets/624a1a92-9e65-4040-9ddb-51ecb3a5b81c">


## Acknowledgements

Sentence and definition data was pulled from:
* [CEDICT](https://cc-cedict.org/editor/editor.php), which releases data under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Because of sharealike, the definitions files should be considered released under that license as well.
* [Tatoeba](https://tatoeba.org/), which releases data under [CC-BY 2.0 FR](https://creativecommons.org/licenses/by/2.0/fr/)
* Loading spinners: https://loading.io/css/
