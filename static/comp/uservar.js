customElements.define(
    tagName(),
    class extends HTMLElement {
        constructor() {
            super();
        }
        draw(user) {
            this.innerHTML = user[this.getAttribute("key")];
        }
    }
);
