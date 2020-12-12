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
          },
          scales: {
            yAxes: [
              {
                gridLines: {
                  color: '#B1E2FF',
                  display: true,
                },
                scaleLabel: {
                  display: true,
                  labelString: "Visitors",
                },
                ticks: {
                  beginAtZero: true,
                  userCallback: function (label) {
                    if (Math.floor(label) === label) return kFormat(label);
                  },
                },
              },
            ],
            xAxes: [
              {
                gridLines: {
                  display: false,
                },
                type: "time",
                time: {
                  unit: "week",
                },
                scaleLabel: {
                  display: false,
                  //labelString: "Date",
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
