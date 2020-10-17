function tagName() {
  var tagName = new URL(document.currentScript.src).pathname
    .slice(1, -3)
    .replaceAll("/", "-");
  return tagName;
}
