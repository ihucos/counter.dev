customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(lang) {
            var lang = this.group(lang);
            var langEntries = Object.entries(lang).sort((a, b) => b[1] - a[1]);
            this.totalCount = Object.values(lang).reduce(
                (acc, next) => acc + next,
                0
            );
            this.innerHTML = `
          <div class="metrics-three-item">
            <div class="metrics-headline">
              <img src="/img/languages.svg" width="24" height="24" alt="Languages">
              <h3 class="ml16">Languages</h3>
            </div>
            <div class="metrics-three-data bg-white radius-lg shadow-sm">
              <div class="metrics-three-data-headline shadow-sm caption gray">
                <span>Language</span>
                <span>Visits</span>
              </div>
              <div class="metrics-three-data-content" data-simplebar data-simplebar-auto-hide="false">
                ${langEntries
                    .map((item) => this.drawItem(item[0], item[1]))
                    .join("")}
                ${
                    langEntries.length === 0
                        ? "<dashboard-nodata></dashboard-nodata>"
                        : ""
                }
              </div>
              <div class="metrics-three-data-footer bg-white"></div>
            </div>
          </div>
            `;
        }

        group(lang) {
            var newLang = {};
            for (const [langName, count] of Object.entries(lang)) {
                // Canadian English -> English
                // Taking the last word works
                let simpleLangName = langName.split(" ").pop();
                newLang[simpleLangName] =
                    (newLang[simpleLangName] || 0) + count;
            }
            return newLang;
        }

        drawItem(lang, count) {
            return `
                <div class="metrics-three-data-content-item">
                  ${escapeHtml(lang)}
                  <span>
                    <dashboard-number class="strong mr16">${count}</dashboard-number>
                    <span class="item-percent bg-blue blue caption">${percentRepr(
                        count,
                        this.totalCount
                    )}</span>
                  </span>
                </div>
            `;
        }
    }
);
