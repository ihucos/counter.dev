


tagNames = []
function tagName(){
    tagName = new URL(document.currentScript.src).pathname
        .slice(1, -3)
        .replaceAll('/', '-');
    tagNames.push(tagName)
    return tagName
}
