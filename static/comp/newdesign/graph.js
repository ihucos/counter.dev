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

        getUTCMinusElevenNow() {
          var date = new Date();
          var now_utc = Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds()
          );

          let d = new Date(now_utc);
          d.setHours(d.getHours() - 11);
          return d;
        }

        daysRange(s, e) {
          var s = new Date(s);
          var e = new Date(e);
          var o = {};
          for (var a = [], d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            o[new Date(d).toISOString().substring(0, 10)] = 0;
          }
          return o;
        };

        getChart(dates) {

            // TODO: add 0 values for days that are not accounted for
            //


            var sortedAvailableDates = Object.keys(dates).sort((a, b) => {
              return a > b;
            });


            var groupedByDay = {
                ...this.daysRange(sortedAvailableDates[0], this.getUTCMinusElevenNow()),
                ...dates
            }

            let groupedByMonth = Object.entries(groupedByDay).reduce((acc, val) => {
                let group = moment(val[0]).format('MMMM');
                acc[group] = (acc[group] || 0) + val[1];
                return acc
            }, {})

            let groupedByWeek = Object.entries(groupedByDay).reduce((acc, val) => {
                let group = moment(val[0]).format('[CW]w');
                acc[group] = (acc[group] || 0) + val[1];
                return acc
            }, {})

            var groupedDates = groupedByDay
            if (Object.keys(groupedDates).length > 31){
                groupedDates = groupedByWeek
                // if it's still to big, use months. 16 is a magic number to swap to the per month view
                if (Object.keys(groupedDates).length > 16){
                    groupedDates = groupedByMonth
                }
            }

            var date_keys = Object.keys(groupedDates);
            var date_vals = Object.values(groupedDates);
            return {
                type: "line",
                data: {
                    labels: date_keys,
                    datasets: [{
                        data: date_vals,
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
