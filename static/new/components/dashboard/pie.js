customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(obj) {
            this.innerHTML = `
                <div class="metrics-headline">
                  <img src="${this.getAttribute(
                      "image"
                  )}" width="24" height="24" alt="${this.getAttribute(
                "caption"
            )}">
                  <h3 class="ml16">${this.getAttribute("caption")}</h3>
                </div>
                <div class="metrics-two-data bg-white shadow-sm radius-lg">
                  ${
                      Object.keys(obj).length > 0
                          ? `
                      <div style="display: flex"> <!-- another hacky container-->
                        <dashboard-piegraph  class="metrics-two-graph-wrap"></dashboard-piegraph>
                      </div>
                      <dashboard-pielegend></dashboard-pielegend>
                      `
                          : `<comp-nodata></comp-nodata>`
                  }
                </div>`;
        }
    }
);
