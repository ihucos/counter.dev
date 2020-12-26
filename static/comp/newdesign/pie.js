customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(obj) {
            if (Object.keys(obj).length > 0) {
                this.innerHTML = `
                <div class="metrics-headline">
                  <img src="img/browsers.svg" width="24" height="24" alt="${this.getAttribute('caption')}">
                  <h3 class="ml16">${this.getAttribute('caption')}</h3>
                </div>
                <div class="metrics-two-data bg-white shadow-sm radius-lg">
                  <div style="display: flex"> <!-- another hacky container-->
                    <comp-newdesign-piegraph  class="metrics-two-graph-wrap"></comp-newdesign-piegraph>
                  </div>
                  <comp-newdesign-pielegend></comp-newdesign-pielegend>
                </div>`
            } else {
                this.innerHTML = `<comp-nodata></comp-nodata>`
            }
        }
    }
);
