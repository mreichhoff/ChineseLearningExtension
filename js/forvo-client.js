async function callForvo(word, key) {
    const x = await fetch(`https://apifree.forvo.com/key/${key}/format/json/action/word-pronunciations/word/${word}/language/zh`);
    const responseJson = await x.json();
    if (!responseJson || !responseJson.items || !responseJson.items.length) {
        return null;
    }
    // TODO: return several, sort by rating
    return responseJson.items[0].pathmp3;
}

export { callForvo }