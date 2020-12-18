customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(lang) {
            var langEntries = Object.entries(lang).sort((a, b) => b[1] - a[1])
            this.totalCount = Object.values(lang).reduce((acc, next) => acc + next, 0)
            this.innerHTML = `
          <div class="metrics-three-item" id="screens">
            <div class="metrics-headline">
              <img src="img/screens.svg" width="24" height="24" alt="Screens">
              <h3 class="ml16">Screens</h3>
            </div>
            <div class="metrics-three-data bg-white radius-lg shadow-sm">
              <div class="metrics-three-data-headline shadow-sm caption gray">
                <span>Dimensions</span>
                <span>Visitors</span>
              </div>
              <div class="metrics-three-data-content" data-simplebar data-simplebar-auto-hide="false">
                ${langEntries.map((item) => this.drawItem(item[0], item[1])).join('')}
              </div>
              <div class="metrics-three-data-footer bg-white"></div>
            </div>
          </div>
            `
        }

        drawItem(lang, count) {
            return `
                <div class="metrics-three-data-content-item">
                  ${escapeHtml(lang)}
                  <span>
                    <span class="strong mr16">${count}</span>
                    <span class="item-percent bg-blue blue caption">${percentRepr(count, this.totalCount)}</span>
                  </span>
                </div>`
        }

    }
);
