
customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(lang) {
            var langEntries = Object.entries(lang).sort((a, b) => b[1] - a[1])
            this.totalCount = Object.values(lang).reduce((acc, next) => acc + next, 0)
            this.innerHTML = `
          <div class="metrics-three-item" id="languages">
            <div class="metrics-headline">
              <img src="img/languages.svg" width="24" height="24" alt="Languages">
              <h3 class="ml16">Languages</h3>
            </div>
            <div class="metrics-three-data bg-white radius-lg shadow-sm">
              <div class="metrics-three-data-headline shadow-sm caption gray">
                <span>Language</span>
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

        drawItem(lang, count){
            return `
                <div class="metrics-three-data-content-item">
                  ${escapeHtml(lang)}
                  <span>
                    <span class="strong mr16">${count}</span>
                    <span class="item-percent bg-blue blue caption">${this.percentRepr(count, this.totalCount)}</span>
                  </span>
                </div>
            `

        }

        percentRepr(value) {
            var percentRepr = Math.round((value / this.totalCount) * 100) + "%";
            if (percentRepr === "0%") {
                percentRepr = "<1%";
            }
            return percentRepr;
        }
    }
);
