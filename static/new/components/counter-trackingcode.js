customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.style.display = "block"
            this.innerHTML = `
                  <div class="tracking-code mb8">
                    <input
                      type="text"
                      id="tracking"
                      class="full"
                      value='<script>if (!sessionStorage.getItem("_swa") && document.referrer.indexOf...'
                      readonly
                    />
                    <button
                      class="btn-primary btn-copy ml16"
                      data-clipboard-target="#tracking"
                    >
                      Copy
                    </button>
                  </div>
                  <span class="caption gray"
                    >Inside the
                    <span class="caption-strong">&lt;head&gt;</span> section</span
                  >`
        }
    }
);
