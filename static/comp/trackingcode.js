customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback(user) {
            this.innerHTML = `
<pre class="rounded mt-3 leading-normal text-xs bg-gray-100 text-gray-700 border py-1 pl-2 overflow-auto max-w-screen-md" ><code>&lt;script&gt; // counter.dev tracking code
if (!sessionStorage.getItem("_swa") && document.referrer.indexOf(location.protocol + "//" + location.host) !== 0) {
    fetch("https://counter.dev/track?" + new URLSearchParams({
        referrer: document.referrer,
        screen: screen.width + "x" + screen.height,
        user: "<comp-uservar key="id"></comp-uservar>",
        utcoffset: <comp-utcoffset></comp-utcoffset>}));}
sessionStorage.setItem("_swa", "1");
&lt;/script&gt;</code></pre> `;
        }
    }
);
