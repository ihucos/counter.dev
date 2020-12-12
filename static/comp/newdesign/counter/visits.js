customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(date) {
            this.innerHTML = Object.values(date).reduce((acc, next) => acc + next, 0)
        }
    }
);