customElements.define(
    tagName(),
    class extends HTMLElement {
        message(msg) {
            this.innerHTML = `
            <div class="refresh">
              <img src="/img/refresh.svg" width="18" height="18" alt="Refresh" />
              <span class="caption gray ml8">${escapeHtml(msg)}</span>
            </div>
            `;
        }
    }
);
