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

        getChart(rawdates, hour, utcoffset, range) {
			if (range == 'daterange'){
				var dates = rawdates
			} else {
				var dates = dFillDatesToNow(rawdates, utcoffset);
			}
            let vals = dGroupDates(dates);
            let labels = vals[0];
            let data = vals[1];

            // Only one day to show, show hours instead
            if (labels.length === 1 || range === "yesterday") {
                hour = dGetNormalizedHours(hour);
                labels = Object.keys(hour);
                data = Object.values(hour);
            }

            return {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            data: data,
                            label: "Visits",
                            backgroundColor: this.makeGradient(),
                            borderColor: "#147EFB",
                            borderWidth: 1,
                            pointRadius: 4,
                            //pointRadius: 0,
                            pointBorderColor: "#FC3158",
                            pointBackgroundColor: "#FFFFFF",
                            lineTension: 0,
                        },
                    ],
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
                        yAxes: [
                            {
                                gridLines: {
                                    color: "#B1E2FF",
                                    zeroLineColor: "#121212",
                                    display: true,
                                },
                                scaleLabel: {
                                    display: false,
                                    //labelString: "Visits",
                                    //fontColor: "#616161",
                                    //fontSize: 14,
                                },
                                ticks: {
                                    beginAtZero: true,
                                    userCallback: function (label) {
                                        if (Math.floor(label) === label)
                                            return numberFormat(label);
                                    },
                                    fontFamily: "Nunito Sans",
                                    fontColor: "#616161",
                                    fontSize: 14,
                                },
                            },
                        ],
                        xAxes: [
                            {
                                gridLines: {
                                    display: false,
                                },
                                //type: "time",
                                scaleLabel: {
                                    display: false,
                                    //labelString: "Date",
                                },
                                ticks: {
                                    fontFamily: "Nunito Sans",
                                    fontColor: "#616161",
                                    fontSize: 14,
                                    userCallback: function (label) {
										if (label.split("-").length - 1 === 2) {
											if (range == "last7") {
												return moment(label).format("dddd")
											} else if (range == "daterange"){
												return moment(label).format("DD MMM");

											} else {
												return moment(label).format("Do");
											}
										}
										return label;
									},
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
