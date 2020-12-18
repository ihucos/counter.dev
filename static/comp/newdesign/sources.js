customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(ref) {
            var allRefEntries = Object.entries(ref).sort((a, b) => b[1] - a[1])
            var refEntries = allRefEntries.slice(0, 10);
            this.totalCount = Object.values(ref).reduce((acc, next) => acc + next, 0)
            this.innerHTML = `
        <div class="sources" id="sources">
          <div class="metrics-headline">
            <img src="img/sources.svg" width="24" height="24" alt="Sources">
            <h3 class="ml16">Sources</h3>
          </div>
          <div class="sources-countries-data caption gray bg-gray mt16 mb24">
            <span>Source</span>
            <span>Visitors</span>
          </div>
          <!-- Items -->
          ${refEntries.map((item) => this.drawItem(item[0], item[1])).join('')}
          <!-- View all -->
          <a href="#modal-sources" class="sources-countries-item sources-countries-item-wrap view-all shadow-sm" rel="modal:open">
            <span>
              <div class="view-all-icon animation"></div>
              <span class="black strong view-all-text animation">View all</span>
            </span>
            <img src="img/chevron-right.svg" width="24" height="24" alt="Chevron">
          </a>
          <!-- /// -->
        </div>
        ${this.drawModal(allRefEntries)}`
        }

        drawItem(domain, count) {
            return `
          <div class="sources-countries-item shadow-sm mb8">
            <div class="percent-line" style="width: ${escapeHtml(percentRepr(count, this.totalCount))};"></div>
            <div class="sources-countries-item-wrap">
              <span>
                <img src="https://icons.duckduckgo.com/ip3/${escapeHtml(domain)}.ico" width="16" height="16" alt="${escapeHtml(domain)}">
                <a href="//${escapeHtml(domain)}" class="black" target="_blank" rel="nofollow">${escapeHtml(domain)}</a>
              </span>
              <span>
                <span class="strong mr16">${escapeHtml(count)}</span>
                <span class="item-percent bg-blue blue caption">${escapeHtml(percentRepr(count, this.totalCount))}</span>
              </span>
            </div>
          </div>
          `
        }

        drawModal(sourcesEntries) {
            return `<div id="modal-sources" style="display: none;">
              <div class="modal-header">
                  <img src="img/sources.svg" width="24" height="24" alt="Countries">
                  <h3 class="ml16">Sources</h3>
                  <a href="#" class="btn-close" rel="modal:close"></a>
                </div>
                <div class="modal-content">
                  ${sourcesEntries.map((item) => this.drawItem(item[0], item[1])).join('')}
                </div>
              </div>`
        }
    }
);
