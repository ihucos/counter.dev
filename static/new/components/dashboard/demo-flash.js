customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(isDemo) {
            if (!isDemo) {
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
