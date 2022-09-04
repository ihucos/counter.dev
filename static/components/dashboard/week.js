customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(weekday) {
            this.innerHTML = `<div class="metrics-three-data-content-day caption">
              <dashboard-week-graph
                class="metrics-three-graph-wrap"
              ></dashboard-week-graph>
              <div class="week-column-wrap mt24">
                <div class="week-column">
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-dark-blue mr8"></span>
                    Mo.
                    <dashboard-number class="caption-strong">
                        ${weekday[1] || 0}
                    </dashboard-number>
                  </span>
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-red mr8"></span>
                    Tu.
                    <dashboard-number class="caption-strong">
                        ${weekday[2] || 0}
                    </dashboard-number>
                  </span>
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-green mr8"></span>
                    We.
                    <dashboard-number class="caption-strong">
                        ${weekday[3] || 0}
                    </dashboard-number>
                  </span>
                  <span class="graph-dot">
                    <span class="graph-dot-ellipse bg-yellow mr8"></span>
                    Th.
                    <dashboard-number class="caption-strong">
                        ${weekday[4] || 0}
                    </dashboard-number>
                  </span>
                </div>
                <div class="week-column">
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-orange mr8"></span>
                    Fr.
                    <dashboard-number class="caption-strong">
                        ${weekday[5] || 0}
                    </dashboard-number>
                  </span>
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-light-blue mr8"></span>
                    Sa.
                    <dashboard-number class="caption-strong">
                        ${weekday[6] || 0}
                    </dashboard-number>
                  </span>
                  <span class="graph-dot">
                    <span class="graph-dot-ellipse bg-dark-gray mr8"></span>
                    Su.
                    <dashboard-number class="caption-strong">
                        ${weekday[0] || 0}
                    </dashboard-number>
                  </span>
                </div>
              </div>
            </div>`;
            this.getElementsByTagName("dashboard-week-graph")[0].draw(weekday);
        }
    }
);
