customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(screen) {
            var screenEntries = Object.entries(screen).sort((a, b) => {
                if (a[0] == "Other") return 1;
                if (b[0] == "Other") return -1;
                return b[1] - a[1];
            });
            this.totalCount = Object.values(screen).reduce(
                (acc, next) => acc + next,
                0
            );
            this.innerHTML = `
          <div class="metrics-three-item">
            <div class="metrics-headline">
              <img src="/img/screens.svg" width="24" height="24" alt="Screens">
              <h3 class="ml16">Screens</h3>
            </div>
            <div class="metrics-three-data bg-white radius-lg shadow-sm">
              <div class="metrics-three-data-headline shadow-sm caption gray">
                <span>Dimensions</span>
                <span>Visits</span>
              </div>
              <div class="metrics-three-data-content" data-simplebar data-simplebar-auto-hide="false">
                ${screenEntries
                    .map((item) => this.drawItem(item[0], item[1]))
                    .join("")}
                ${
                    screenEntries.length === 0
                        ? "<dashboard-nodata></dashboard-nodata>"
                        : ""
                }
              </div>
              <div class="metrics-three-data-footer bg-white"></div>
            </div>
          </div>
            `;
        }

        drawItem(screen, count) {
            return `
                <div class="metrics-three-data-content-item">
                  ${escapeHtml(screen)}
                  <span>
                    <dashboard-number class="strong mr16">${count}</dashboard-number>
                    <span class="item-percent bg-blue blue caption">${percentRepr(
                        count,
                        this.totalCount
                    )}</span>
                  </span>
                </div>`;
        }
    }
);
