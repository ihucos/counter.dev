


_tagNames = []
function tagName(){
    var tagName = new URL(document.currentScript.src).pathname
        .slice(1, -3)
        .replaceAll('/', '-');
    _tagNames.push(tagName)
    return tagName
}

function getGeneratedTagNames(){
   return _tagNames
}
