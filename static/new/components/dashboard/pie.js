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
                      <div style="display: flex"> <!-- another hacky container-->
                        <dashboard-piegraph  class="metrics-two-graph-wrap"></dashboard-piegraph>
                      </div>
                      ${this.getLegend(obj)}`
                          : `<comp-nodata></comp-nodata>`
                  }
                </div>`;
        }

        getLegend(obj) {
            var aggr = dGroupData(obj, 3);
            var aggrkeys = Object.keys(dGroupData(obj, 3));
            return `
            <div class="caption mt24">
              <span class="graph-dot mb8" style="visibility: ${
                  aggrkeys.length < 1 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-dark-blue mr8"></span>
                ${escapeHtml(aggrkeys[0])}
                <span class="caption-strong">247</span>
              </span>
              <span class="graph-dot mb8" style="visibility: ${
                  aggrkeys.length < 2 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-red mr8"></span>
                ${escapeHtml(aggrkeys[1])}
                <span class="caption-strong">247</span>
              </span>
              <span class="graph-dot mb8" style="visibility: ${
                  aggrkeys.length < 3 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-green mr8"></span>
                ${escapeHtml(aggrkeys[2])}
                <span class="caption-strong">247</span>
              </span>
              <span class="graph-dot"     style="visibility: ${
                  aggrkeys.length < 4 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-yellow mr8"></span>
                ${escapeHtml(aggrkeys[3])}
                <span class="caption-strong">247</span>
              </span>
            </div>`;
        }
    }
);
