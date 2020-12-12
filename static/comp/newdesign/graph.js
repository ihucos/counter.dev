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
      var date_keys = Object.keys(dates);
      var date_vals = Object.values(dates);
      return {
        type: "line",
        data: {
          labels: date_keys,
          datasets: [
            {
              data: date_vals,
              label: "Visitors",
              backgroundColor: this.makeGradient(),
              borderColor: '#147EFB',
              borderWidth: 1,
		    pointRadius: 4,
              pointBorderColor: '#FC3158',
              pointBackgroundColor: '#FFFFFF',
              lineTension: 0,
            },
          ],
        },
        options: {
          title: {
            display: false,
          },
          tooltips: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: '#ffffff',
            borderColor: '#121212',
            titleFontColor: '#121212',
            borderWidth: 1,
            titleFontFamily: 'Nunito Sans',
            bodyFontColor: '#121212',
            cornerRadius: 2,
            caretPadding: 20,
            xPadding: 8,
            yPadding: 12,
          },
          scales: {
            yAxes: [
              {
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
                  userCallback: function (label) {
                    if (Math.floor(label) === label) return kFormat(label);
                  },
                  fontFamily: 'Nunito Sans',
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
                type: "time",
                //time: {
                  //unit: "day",
                //},
                scaleLabel: {
                  display: false,
                  //labelString: "Date",
                },
                ticks: {
                  fontFamily: 'Nunito Sans',
                  fontColor: "#616161",
                  fontSize: 14,
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
