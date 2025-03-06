customElements.define(
    tagName(),
    class extends Counter {
        count(visits) {
            return Object.values(visits.date).reduce(
                (acc, next) => acc + next,
                0
            );
        }
    }
);
