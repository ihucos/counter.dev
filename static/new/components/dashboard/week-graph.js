customElements.define(
    tagName(),
    class extends BaseGraph {
        emptyIfSumZero(arr) {
            if (arr.reduce((pv, cv) => pv + cv, 0) === 0) {
                return [];
            }
            return arr;
        }

        getChart(entries) {
            var hourKeys = Object.keys(hour);
            var hourVals = Object.values(hour);
            return {
                type: "bar",
                data: {
                    labels: ["Mo.", "Tu.", "We.", "Th.", "Fr.", "Sa.", "Su."],
                    datasets: [
                        {
                            data: this.emptyIfSumZero([
                                entries[0] || 0,
                                entries[1] || 0,
                                entries[2] || 0,
                                entries[3] || 0,
                                entries[4] || 0,
                                entries[5] || 0,
                                entries[6] || 0,
                            ]),
                            label: "Visitors",
                            borderWidth: 0,
                            backgroundColor: [
                                "#147EFB",
                                "#FC3158",
                                "#53D769",
                                "#FECB2E",
                                "#FD9426",
                                "#5FC9F8",
                                "#9E9E9E",
                            ],
                        },
                    ],
                },
                options: {
                    maintainAspectRatio: false,
                    title: {
                        display: false,
                    },
                    scales: {
                        yAxes: [
                            {
                                gridLines: {
                                    zeroLineColor: "#121212",
                                    color: "#fff",
                                    tickMarkLength: 0,
                                },
                                ticks: {
                                    display: false,
                                    beginAtZero: true,
                                    padding: 0,
                                },
                            },
                        ],
                        xAxes: [
                            {
                                barThickness: 8,
                                gridLines: {
                                    display: false,
                                },
                                ticks: {
                                    display: false,
                                },
                            },
                        ],
                    },
                    legend: {
                        display: false,
                    },
                },
            };
        }
    }
);
