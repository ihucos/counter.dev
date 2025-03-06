customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(page) {
            var entries = Object.entries(page || {}).sort(
                (a, b) => b[1] - a[1]
            );
            this.innerHTML = `
        <div class="metrics-four-item">
          <div class="metrics-headline">
            <img src="/img/pages.svg" width="24" height="24" alt="Pages">
            <h3 class="ml16"
                tooltip="This data is gathered by the new default external tracking script."
                flow="right">
                Pageviews<span class="blue">*&nbsp;</span>
            </h3>
          </div>
          <div class="metrics-three-data bg-white radius-lg shadow-sm">
            <div class="metrics-three-data-headline shadow-sm caption gray">
              <span>Page</span>
              <span>Views</span>
            </div>
            <div class="metrics-three-data-content caption" data-simplebar data-simplebar-auto-hide="false">
              ${entries
                  .map(
                      (item) => `
              <div class="hour-item">
                <span class="page">${escapeHtml(item[0])}</span>
                <dashboard-number class="caption-strong">${
                    item[1]
                }</dashboard-number>
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
