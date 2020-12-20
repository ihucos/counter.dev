customElements.define(
    tagName(),
    class extends BaseGraph {

        makeGradient(alpha1, alpha2) {
            var ctx = this.canvas.getContext("2d");
            var gradientStroke = ctx.createLinearGradient(0, 0, 0, 400);
            gradientStroke.addColorStop(0, "rgba(231, 246, 255, 1)");
            gradientStroke.addColorStop(1, "rgba(255, 255, 255, 0)");
            return gradientStroke;
        }

        getChart(dates) {

            let vals = dNormalizedDates(dates)
            let dateKeys = vals[0]
            let dateVals = vals[1]

            return {
                type: "line",
                data: {
                    labels: dateKeys,
                    datasets: [{
                        data: dateVals,
                        label: "Visitors",
                        backgroundColor: this.makeGradient(),
                        borderColor: '#147EFB',
                        borderWidth: 1,
                        pointRadius: 4,
                        //pointRadius: 0,
                        pointBorderColor: '#FC3158',
                        pointBackgroundColor: '#FFFFFF',
                        lineTension: 0,
                    }, ],
                },
                options: {
                    title: {
                        display: false,
                    },
                    tooltips: {
                        caretPadding: 20,
                        intersect: false,
                    },
                    scales: {
                        yAxes: [{
                            gridLines: {
                                color: '#B1E2FF',
                                zeroLineColor: '#121212',
                                display: true,
                            },
                            scaleLabel: {
                                display: false,
                                //labelString: "Visitors",
                                //fontColor: "#616161",
                                //fontSize: 14,
                            },
                            ticks: {
                                beginAtZero: true,
                                userCallback: function(label) {
                                    if (Math.floor(label) === label) return kFormat(label);
                                },
                                fontFamily: 'Nunito Sans',
                                fontColor: "#616161",
                                fontSize: 14,
                            },
                        }, ],
                        xAxes: [{
                            gridLines: {
                                display: false,
                            },
                            //type: "time",
                            time: {
                                //unit: "day",
                                //tooltipFormat: 'MM/DD/YYYY'
                            },
                            scaleLabel: {
                                display: false,
                                //labelString: "Date",
                            },
                            ticks: {
                                fontFamily: 'Nunito Sans',
                                fontColor: "#616161",
                                fontSize: 14,
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
