customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(sessionless) {
            if (sessionless) {
                $(this).css("margin", "0");
                return;
            }

            this.innerHTML = `
              <a href="#modal-add" class="btn-primary" style="width: 100%" rel="modal:open">
                Add website</a>`;
        }
    }
);
