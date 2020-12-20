customElements.define(
    tagName(),
    class extends Counter {
        count(visits) {
            let referrerTraffic = Object.values(visits.ref).reduce((acc, next) => acc + next, 0)
            let allTraffi = Object.values(visits.date).reduce((acc, next) => acc + next, 0)
            return allTraffi - referrerTraffic
        }
    }
);
