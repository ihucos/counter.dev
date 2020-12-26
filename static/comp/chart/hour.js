customElements.define(
    tagName(),
    class extends BaseGraph {
        getChart(hours) {
            return {
                type: "radar",
                data: {
                    labels: [
                        "24",
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "11",
                        "12",
                        "13",
                        "14",
                        "15",
                        "16",
                        "17",
                        "18",
                        "19",
                        "20",
                        "21",
                        "22",
                        "23",
                    ],
                    datasets: [
                        {
                            data: emptyIfSumZero([
                                hours[0] || 0,
                                hours[1] || 0,
                                hours[2] || 0,
                                hours[3] || 0,
                                hours[4] || 0,
                                hours[5] || 0,
                                hours[6] || 0,
                                hours[7] || 0,
                                hours[8] || 0,
                                hours[9] || 0,
                                hours[10] || 0,
                                hours[11] || 0,
                                hours[12] || 0,
                                hours[13] || 0,
                                hours[14] || 0,
                                hours[15] || 0,
                                hours[16] || 0,
                                hours[17] || 0,
                                hours[18] || 0,
                                hours[19] || 0,
                                hours[20] || 0,
                                hours[21] || 0,
                                hours[22] || 0,
                                hours[23] || 0,
                            ]),
                            backgroundColor: this.makeGradient(),
                            borderWidth: 1,
                            borderColor: "transparent",
                            pointBackgroundColor: "white",
                            pointRadius: 3,
                            pointBorderColor: this.palette[0],
                            lineTension: 0.4,
                        },
                    ],
                },
                options: {
                    title: {
                        display: true,
                        text: "Visits by hour",
                        position: "top",
                    },
                    tooltips: {
                        mode: "index",
                    },
                    legend: {
                        display: false,
                    },
                    scale: {
                        gridLines: {
                            display: true,
                            circular: true,
                        },
                        ticks: {
                            display: false,
                        },
                    },
                },
            };
        }
    }
);
