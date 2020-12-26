customElements.define(
    tagName(),
    class extends BaseGraph {
        getChart(refentries, dates) {
            var colors = [this.palette[2], this.palette[1], this.palette[0]];
            var otherColor = this.palette[3];
            var directColor = "rgba(0,0,0,0.12)";

            var topRefs = dGroupData(refentries, 3);
            var total = sum(Object.values(dates));
            var ref = sum(Object.values(refentries));
            var direct = total - ref;
            topRefs["Direct"] = direct;

            var entries = [];
            for (const [key, value] of Object.entries(topRefs)) {
                if (key === "Direct") {
                    var color = directColor;
                } else if (key === "Other") {
                    var color = otherColor;
                } else {
                    var color = colors.pop();
                }
                entries.push({
                    label: key,
                    value: value,
                    color: color,
                });
            }

            return {
                type: "pie",
                data: {
                    labels: entries.map((x) => x.label),
                    datasets: [
                        {
                            borderWidth: this.pieBorderWidth,
                            borderColor: this.pieBorderColor,
                            data: emptyIfSumZero(entries.map((x) => x.value)),
                            backgroundColor: entries.map((x) => x.color),
                        },
                    ],
                },
                options: {
                    //cutoutPercentage: 50,
                    tooltips: {
                        mode: "index",
                    },
                    legend: {
                        position: "left",
                        labels: {
                            usePointStyle: "true",
                        },
                        align: "center",
                    },
                    title: {
                        display: true,
                        text: "Top Traffic Sources",
                        position: "top",
                    },
                    scales: {
                        xAxes: [
                            {
                                gridLines: {
                                    display: false,
                                },
                                ticks: {
                                    beginAtZero: true,
                                    display: false,
                                },
                            },
                        ],
                        yAxes: [
                            {
                                gridLines: {
                                    display: false,
                                },
                                ticks: {
                                    beginAtZero: true,
                                    display: false,
                                },
                            },
                        ],
                    },
                },
            };
        }
    }
);
