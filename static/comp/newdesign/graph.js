customElements.define(
  tagName(),
  class extends BaseGraph {

    makeGradient(alpha1, alpha2) {
      var ctx = this.canvas.getContext("2d");
      var gradientStroke = ctx.createLinearGradient(0, 0, 0, 200);
      gradientStroke.addColorStop(0, "rgba(30, 135, 240, 0.6)");
      gradientStroke.addColorStop(1, "rgba(30, 135, 240, 0.1)");
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
              label: "Visits",
              backgroundColor: this.makeGradient(),
              borderColor: '#B1E2FF',
              borderWidth: 1,
              pointBorderColor: '#FC3158',
              pointBackgroundColor: '#FFFFFF',
            },
          ],
        },
        options: {
          title: {
            display: true,
            text: "All days",
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
                  display: true,
                },
                scaleLabel: {
                  display: true,
                  labelString: "Visits",
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
