
customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            if (!window.location.href.split('#')[0].endsWith('/dashboard.html?demo=1')){
                this.innerHTML += `
                   <!-- Notification -->
                   <section class="notification">
                     <div class="content">
                       <span>Enjoy our new design!</span>
                       <div class="btn-close" onclick="this.closest('section').remove()"></div>
                     </div>
                   </section>`;
            }
        }
    }
);
