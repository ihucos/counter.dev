customElements.define(
    tagName(),
    class extends HTMLElement {

        draw(weekday){
            this.innerHTML = `<div class="metrics-three-data-content-day caption">
              <dashboard-week-graph
                class="metrics-three-graph-wrap"
              ></dashboard-week-graph>
              <div class="week-column-wrap mt24">
                <div class="week-column">
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-dark-blue mr8"></span>
                    Mo.
                    <span class="caption-strong">${weekday[0]}</span>
                  </span>
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-red mr8"></span>
                    Tu.
                    <span class="caption-strong">${weekday[1]}</span>
                  </span>
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-green mr8"></span>
                    We.
                    <span class="caption-strong">${weekday[2]}</span>
                  </span>
                  <span class="graph-dot">
                    <span class="graph-dot-ellipse bg-yellow mr8"></span>
                    Th.
                    <span class="caption-strong">${weekday[3]}</span>
                  </span>
                </div>
                <div class="week-column">
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-orange mr8"></span>
                    Fr.
                    <span class="caption-strong">${weekday[4]}</span>
                  </span>
                  <span class="graph-dot mb8">
                    <span class="graph-dot-ellipse bg-light-blue mr8"></span>
                    Sa.
                    <span class="caption-strong">${weekday[5]}</span>
                  </span>
                  <span class="graph-dot">
                    <span class="graph-dot-ellipse bg-dark-gray mr8"></span>
                    Su.
                    <span class="caption-strong">${weekday[6]}</span>
                  </span>
                </div>
              </div>
            </div>`
            this.getElementsByTagName("dashboard-week-graph")[0].draw(weekday)
        }
    }
)
