customElements.define(
  tagName(),
  class extends BaseGraph {
    getChart(entries) {
      return {
        type: "radar",
        data: {
          labels: ["Mo.", "Tu.", "We.", "Th.", "Fr.", "Sa.", "Su."],
          datasets: [
            {
              data: emptyIfSumZero([
                entries[0] || 0,
                entries[1] || 0,
                entries[2] || 0,
                entries[3] || 0,
                entries[4] || 0,
                entries[5] || 0,
                entries[6] || 0,
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
            text: "Visits by weekday",
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
