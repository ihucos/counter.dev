customElements.define(
    tagName(),
    class extends BaseGraph {

        sumHours(entries, arr) {
            var sum = 0;
            arr.forEach((el) => (sum += entries[el] || 0));
            return sum;
        };


        emptyIfSumZero(arr) {
            if (arr.reduce((pv, cv) => pv + cv, 0) === 0) {
                return [];
            }
            return arr;
        }

        getChart(hour) {

            var hourKeys = Object.keys(hour);
            var hourVals = Object.values(hour);
            return {
                type: "bar",
                data: {
                    labels: ["Morning", "Afternoon", "Evening", "Night"],
                    datasets: [{
                        data: this.emptyIfSumZero([
                            this.sumHours(hour, [5, 6, 7, 8, 9, 10, 11]),
                            this.sumHours(hour, [12, 13, 14, 15]),
                            this.sumHours(hour, [16, 17, 18, 19, 20, 21]),
                            this.sumHours(hour, [22, 23, 24, 0, 1, 2, 3, 4]),
                        ]),
                        label: "Visitors",
                        borderWidth: 0,
                        backgroundColor: [
                            'rgb(20, 126, 251)',
                            'rgb(252, 49, 88)',
                            'rgb(83, 215, 105)',
                            'rgb(254, 203, 46)',
                            'rgb(95, 201, 248)',
                            'rgb(158, 158, 158)'
                        ],
                    }, ],
                },
                options: {
                    maintainAspectRatio: false,
                    title: {
                        display: false,
                    },
                    scales: {
                        yAxes: [{
                            gridLines: {
                                zeroLineColor: '#121212',
                                color: '#fff',
                                tickMarkLength: 0,
                            },
                            ticks: {
                                display: false,
                                beginAtZero: true,
                                padding: 0,
                            },
                        }, ],
                        xAxes: [{
                            barThickness: 8,
                            gridLines: {
                                display: false,
                            },
                            ticks: {
                                display: false,
                            },
                        }, ],
                    },
                    legend: {
                        display: false,
                    },
                },
            };
        }
    }
);
