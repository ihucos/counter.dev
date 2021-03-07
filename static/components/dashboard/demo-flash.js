customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            if (!document.location.href.endsWith('?demo=1')) {
                return;
            }
            this.innerHTML = `
               <!-- Notification -->
               <section class="notification">
                 <div class="content">
                   <span>You are viewing the demo. <a href="welcome.html?sign-up">Sign Up</a></span>
                 </div>
               </section>`;
        }
    }
);
