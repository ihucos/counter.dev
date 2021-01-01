customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(user) {
            this.classList.add("headline-right");
            this.classList.add("caption");
            if (user.token) {
                let shareLink = window.location.href.split('#')[0] + "#shared-" + user.token
                this.innerHTML = `
                    <img src="img/eye.svg" width="20" height="18" alt="Shareable" />
                    <span class="gray ml8 mr16">This account is shareable</span>
                    <a data-clipboard-text="${escapeHtml(shareLink)}" href="#" class="mr16 caption-strong black btn-copy">Copy url</a>
                    <a id="share-remove" href="#" class="caption-strong black">Remove url</a>`;
            } else {
                this.innerHTML = `
                    <img
                      src="img/eye-slash.svg"
                      width="20"
                      height="18"
                      alt="Not shareable"
                    />
                    <span class="gray ml8 mr16">This account has no share link</span>
                    <a id="share-create" href="#" class="caption-strong black">Share</a>`;
            }

            //document.getElementById('share-copy').onclick = function(evt){
            //    alert(4)
            //}
        }
    }
);
