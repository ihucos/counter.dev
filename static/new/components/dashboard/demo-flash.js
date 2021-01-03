customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(isDemo){
            if (!isDemo){
                return
            }
            this.innerHTML = `
               <!-- Notification -->
               <section class="notification">
                 <div class="content">
                   <span>You are viewing the demo <a href="welcome.html">Sign Up</a></span>
                   <div class="btn-close" onclick="this.closest('section').remove()"></div>
                 </div>
               </section>`
        }
    }
)
