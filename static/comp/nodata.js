customElements.define(
  tagName(),
  class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = '<div class="nodata">No data for selected time</div>';
    }
  }
);
