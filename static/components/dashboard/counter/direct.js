customElements.define(
    tagName(),
    class extends Counter {
        count(visits) {
			const referrerTraffic = Object.values(visits.ref).reduce(
				(acc, next) => acc + next,
				0,
			);
			const allTraffi = Object.values(visits.date).reduce(
				(acc, next) => acc + next,
				0,
			);
			return allTraffi - referrerTraffic;
		}
	},
);
