


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

function emptyIfSumZero(arr) {
    if (arr.reduce((pv, cv) => pv + cv, 0) === 0) {
        return []
    }
    return arr
}
