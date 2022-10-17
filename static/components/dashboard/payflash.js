customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML += `
               <!-- Notification -->
               <section class="notification">
                 <div class="content">
                   <span>Pay for the service - remove this banner. <a href='#'>Support counter with 12&euro; / year.</a></span>
                 </div>
               </section>`;
        }
    }
);
