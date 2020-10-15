customElements.define(
  tagName(),
  class extends BaseGraph {
    getChart(entries) {
      var sumHours = function (arr) {
        var sum = 0;
        arr.forEach((el) => (sum += entries[el] || 0));
        return sum;
      };

      return {
        type: "bar",
        data: {
          labels: ["Morning", "Afternoon", "Evening", "Night"],
          datasets: [
            {
              maxBarThickness: 10,
              data: emptyIfSumZero([
                sumHours([5, 6, 7, 8, 9, 10, 11]),
                sumHours([12, 13, 14, 15]),
                sumHours([16, 17, 18, 19, 20, 21]),
                sumHours([22, 23, 24, 0, 1, 2, 3, 4]),
              ]),
              backgroundColor: this.makeGradient(),
            },
          ],
        },
        options: {
          tooltips: {
            mode: "index",
          },
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Visits by time",
            position: "top",
          },
          scales: {
            yAxes: [
              {
                gridLines: {
                  display: false,
                },
                ticks: {
                  display: false,
                  beginAtZero: true,
                },
              },
            ],
            xAxes: [
              {
                gridLines: {
                  display: false,
                },
                ticks: {
                  beginAtZero: true,
                },
              },
            ],
          },
        },
      };
    }
  }
);
