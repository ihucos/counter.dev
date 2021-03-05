customElements.define(
    tagName(),
    class extends HTMLElement {
        getTrackingCode(user, utcoffset) {
            return `<script>if(!sessionStorage.getItem("_swa")&&document.referrer.indexOf(location.protocol+"//"+location.host)!== 0){fetch("https://counter.dev/track?"+new URLSearchParams({referrer:document.referrer,screen:screen.width+"x"+screen.height,user:${JSON.stringify(
                user
            )},utcoffset:${JSON.stringify(
                utcoffset
            )}}))};sessionStorage.setItem("_swa","1");</script>`;
        }

        draw(user, utcoffset) {
            this.style.display = "block";
            var randId = "tracking-" + Math.floor(Math.random() * 1000000 + 1);
            this.innerHTML = `
                  <div class="tracking-code mb8">
                    <input
                      type="text"
                      id="${randId}"
                      class="full"
                      value='${this.getTrackingCode(user, utcoffset)}'
                      readonly
                    />
                    <button
                      class="btn-primary btn-copy ml16"
                      data-clipboard-target="#${randId}"
                    >
                      Copy
                    </button>
                  </div>
                  <span class="caption gray"
                    >Inside the
                    <span class="caption-strong">&lt;head&gt;</span> section</span
                  >`;
            new ClipboardJS(this.querySelector(".btn-copy"));
        }
    }
);
