customElements.define(
    tagName(),
    class extends HTMLElement {
        flash(msg) {
            this.innerHTML += `
               <!-- Notification -->
               <section class="notification">
                 <div class="content">
                   <span>${msg}</span>
                   <div class="btn-close" onclick="this.closest('section').remove()"></div>
                 </div>
               </section>`;
        }
    },
);
