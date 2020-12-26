customElements.define(
    tagName(),
    class extends BaseGraph {
        getChart(dates) {
            var date_keys;
            var date_vals;
            [date_keys, date_vals] = dGetNormalizedDateData(dates);

            var num = 7;
            return {
                type: "line",
                data: {
                    labels: date_keys
                        .slice(-1 * num)
                        .map((x) => moment(x).format("Do MMMM")),
                    datasets: [
                        {
                            data: date_vals.slice(-1 * num),
                            label: "Visits",
                            backgroundColor: this.makeGradient(0.7, 0.1),
                            borderColor: this.palette[0],
                            //pointBorderColor: 'rgba(47, 108, 162, 0.5)',
                            pointBackgroundColor: "rgba(47, 108, 162, 1)",
                            pointBorderWidth: 2,
                        },
                    ],
                },
                options: {
                    elements: {
                        line: {
                            tension: 0,
                        },
                    },
                    title: {
                        display: true,
                        text: "Last Days",
                    },
                    tooltips: {
                        enabled: true,
                        mode: "index",
                        intersect: false,
                    },
                    scales: {
                        yAxes: [
                            {
                                scaleLabel: {
                                    display: true,
                                    labelString: "Visits",
                                },
                                ticks: {
                                    maxTicksLimit: 5,
                                    userCallback: function (label) {
                                        if (Math.floor(label) === label)
                                            return kFormat(label);
                                    },
                                },
                                gridLines: {
                                    display: true,
                                },
                            },
                        ],
                        xAxes: [
                            {
                                gridLines: {
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
