customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(obj) {
            var aggr = dGroupData(obj, 3);
            var aggrkeys = Object.keys(dGroupData(obj, 3));
            this.innerHTML = `
            <div class="caption mt24">
              <span class="graph-dot mb8" style="visibility: ${
                  aggrkeys.length < 1 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-dark-blue mr8"></span>
                ${escapeHtml(aggrkeys[0])}
              </span>
              <span class="graph-dot mb8" style="visibility: ${
                  aggrkeys.length < 2 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-red mr8"></span>
                ${escapeHtml(aggrkeys[1])}
              </span>
              <span class="graph-dot mb8" style="visibility: ${
                  aggrkeys.length < 3 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-green mr8"></span>
                ${escapeHtml(aggrkeys[2])}
              </span>
              <span class="graph-dot"     style="visibility: ${
                  aggrkeys.length < 4 ? "hidden" : "visible"
              }">
                <span class="graph-dot-ellipse bg-yellow mr8"></span>
                ${escapeHtml(aggrkeys[3])}
              </span>
            </div>`;
        }
    }
);
