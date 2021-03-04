
customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML += `
               <!-- Notification -->
               <section class="notification">
                 <div class="content">
                   <span>We are happy to announce a new design!</span>
                   <div class="btn-close" onclick="this.closest('section').remove()"></div>
                 </div>
               </section>`;
        }
    }
);
