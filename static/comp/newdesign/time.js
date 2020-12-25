customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(time) {
            this.innerHTML = `
              <div style="display: flex"> <!-- hacky container for the graphs -->
                <comp-newdesign-time-graph class="metrics-three-graph-wrap"></comp-newdesign-time-graph>
              </div>
              <div class="caption mt24">
                <span class="graph-dot mb8">
                  <span class="graph-dot-ellipse bg-dark-blue mr8"></span>
                  Morning
                </span>
                <span class="graph-dot mb8">
                  <span class="graph-dot-ellipse bg-red mr8"></span>
                  Afternoon
                </span>
                <span class="graph-dot mb8">
                  <span class="graph-dot-ellipse bg-green mr8"></span>
                  Evening
                </span>
                <span class="graph-dot">
                  <span class="graph-dot-ellipse bg-yellow mr8"></span>
                  Night
                </span>
              </div>`
        }
    });
