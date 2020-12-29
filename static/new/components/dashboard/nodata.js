customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML =
                '<div class="nodata"><img src="img/nodata.svg"></img><span>No data</span></div>';
        }
    }
);
