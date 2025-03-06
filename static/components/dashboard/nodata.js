customElements.define(
    tagName(),
    class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: "open" }).innerHTML = `
                <style>
                img {
                  height: 20px;
                  width: 16px;
                  margin-right: 12px;
                }

                :host {
                  align-items: center;
                  border-radius: 16px;
                  box-shadow: inset 0 0 0 1px #b1e2ff;
                  color: #616161;
                  display: flex;
                  flex-grow: 1;
                  font-size: 14px;
                  justify-content: center;
                  line-height: 19px;
                  min-height: 6rem;
                }
                </style>
                <img src="/img/nodata.svg"></img><span>No data</span>`;
        }
    }
);
