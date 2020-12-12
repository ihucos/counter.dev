customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(date, ref) {
            let referrerTraffic = Object.values(ref).reduce((acc, next) => acc + next, 0)
            let allTraffi = Object.values(date).reduce((acc, next) => acc + next, 0)
            this.innerHTML = allTraffi - referrerTraffic
        }
    }
);