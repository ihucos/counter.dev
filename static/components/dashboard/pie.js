customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(obj) {
            this.innerHTML = `
                <div class="metrics-headline">
                  <img src="${this.getAttribute(
                      "image"
                  )}" width="24" height="24" alt="${this.getAttribute(
                "caption"
            )}">
                  <h3 class="ml16">${this.getAttribute("caption")}</h3>
                </div>
                <div class="metrics-two-data bg-white shadow-sm radius-lg">
                  ${
                      Object.keys(obj).length > 0
                          ? `
                          <div class="metrics-two-graph-wrap">
                            <canvas></canvas>
                          </div>
                      ${this.getLegend(obj)}`
                          : `<dashboard-nodata></dashboard-nodata>`
                  }
                </div>`;
            let canvas = this.getElementsByTagName("canvas")[0];
            if (canvas) {
                let chartData = this.getChart(obj);
                new Chart(canvas, chartData);
            }
        }

        getLegend(obj) {
            let aggr = dGroupData(obj, 3);
            let aggrKeys = Object.keys(aggr);
            let aggrVals = Object.values(aggr);
            return `
            <div class="caption mt24">
              <span class="graph-dot mb8" style="visibility: ${
                  aggrKeys.length < 1 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-dark-blue mr8"></span>
                ${escapeHtml(aggrKeys[0])}
                <dashboard-number class="caption-strong">
                    ${escapeHtml(aggrVals[0])}
                </dashboard-number>
              </span>
              <span class="graph-dot mb8" style="visibility: ${
                  aggrKeys.length < 2 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-red mr8"></span>
                ${escapeHtml(aggrKeys[1])}
                <dashboard-number class="caption-strong">
                    ${escapeHtml(aggrVals[1])}
                </dashboard-number>
              </span>
              <span class="graph-dot mb8" style="visibility: ${
                  aggrKeys.length < 3 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-green mr8"></span>
                ${escapeHtml(aggrKeys[2])}
                <dashboard-number class="caption-strong">
                    ${escapeHtml(aggrVals[2])}
                </dashboard-number>
              </span>
              <span class="graph-dot"     style="visibility: ${
                  aggrKeys.length < 4 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-yellow mr8"></span>
                ${escapeHtml(aggrKeys[3])}
                <dashboard-number class="caption-strong">
                    ${escapeHtml(aggrVals[3])}
                </dashboard-number>
              </span>
            </div>`;
        }

        getChart(obj) {
            var aggr = dGroupData(obj, 3);
            return {
                type: "pie",
                data: {
                    labels: Object.keys(aggr),
                    datasets: [
                        {
                            backgroundColor: [
                                "#147EFB",
                                "#FC3158",
                                "#53D769",
                                "#FECB2E",
                            ],
                            hoverBorderColor: "#ffffff",
                            borderWidth: 2,
                            data: Object.values(aggr),
                        },
                    ],
                },
                options: {
                    cutoutPercentage: 33.33,
                    aspectRatio: 1,
                    legend: {
                        display: false,
                    },
                },
            };
        }
    }
);
