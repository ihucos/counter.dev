customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(loc) {
            var entries = Object.entries(loc).sort((a, b) => b[1] - a[1]);
            this.innerHTML = `
        <div class="metrics-four-item">
          <div class="metrics-headline">
            <img src="/img/pages.svg" width="24" height="24" alt="Pages">
            <h3 class="ml16">Entry Pages</h3>
          </div>
          <div class="metrics-three-data bg-white radius-lg shadow-sm">
            <div class="metrics-three-data-headline shadow-sm caption gray">
              <span>Page</span>
              <span>Visits</span>
            </div>
            <div class="metrics-three-data-content caption" data-simplebar data-simplebar-auto-hide="false">
              ${entries
                  .map(
                      (item) => `
              <div class="hour-item">
                <span class="page">${escapeHtml(item[0])}</span>
                <span class="caption-strong">${item[1]}</span>
              </div>`
                  )
                  .join("")}
            ${
                entries.length === 0
                    ? "<dashboard-nodata></dashboard-nodata>"
                    : ""
            }
            </div>
            <div class="metrics-three-data-footer bg-white"></div>
          </div>
        </div>`;
        }
    }
);
