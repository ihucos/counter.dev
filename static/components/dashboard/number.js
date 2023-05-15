customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            if (this.getAttribute("data-connected") == "1") {
                return;
            }
            this.setAttribute("data-connected", "1");
            let num = Number(this.innerHTML);
            this.setAttribute("title", numberFormat(num));
            this.innerHTML = numberFormat(num);
        }
    }
);
