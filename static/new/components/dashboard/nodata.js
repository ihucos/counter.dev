customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML =
                '<img src="img/nodata.svg"></img><span>No data</span>';
        }
    }
);
