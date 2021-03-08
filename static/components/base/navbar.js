customElements.define(
    tagName(),
    class extends HTMLElement {
        hash(str) {
            var hash = 0,
                i,
                chr;
            if (str.length === 0) return hash;
            for (i = 0; i < str.length; i++) {
                chr = str.charCodeAt(i);
                hash = (hash << 5) - hash + chr;
                hash |= 0; // Convert to 32bit integer
            }
            return hash;
        }

        loadUser() {
            if (!document.cookie.includes("swa=")) {
                this.noUser();
                return;
            }

            // invalidates cache key when cookie changes
            var usernameCacheKey =
                "navbar-username-cache-" + this.hash(document.cookie);

            var cachedUsername = sessionStorage.getItem(usernameCacheKey);
            if (cachedUsername !== null) {
                // call hasUser before the uncached call with the value from
                // the server arrives in order to not cause the frontend to
                // flicker
                this.hasUser(cachedUsername);
            }

            var source = new EventSource("/dump");
            source.onmessage = (event) => {
                let dump = JSON.parse(event.data);
                if (!dump) {
                    this.noUser();
                } else {
                    this.hasUser(dump.user.id);
                    sessionStorage.setItem(usernameCacheKey, dump.user.id);
                    // the fallback is because older user's dont set the
                    // utcoffset by default
                    this.drawEditaccount(
                        dump.user.prefs.utcoffset || getUTCOffset()
                    );
                    document.dispatchEvent(new CustomEvent("userloaded"));
                }
                source.close(); // don't leave an open connection to server to save resources
            };
        }

        noUser() {
            document
                .querySelectorAll(".no-user")
                .forEach((el) => (el.style.display = "block"));
        }

        hasUser(user) {
            document
                .querySelectorAll(".has-user")
                .forEach((el) => (el.style.display = "block"));
            Array.from(
                document.getElementsByClassName("fill-username")
            ).forEach((el) => {
                el.innerHTML = escapeHtml(user);
            });
        }

        drawEditaccount(utcoffset) {
            var ea = this.querySelector("base-editaccount");
            customElements.upgrade(ea);
            ea.draw(utcoffset);
        }

        connectedCallback() {
            // HACK: this should obviously not be in the navbar
            if (location.href.startsWith("https://simple-web-analytics.com")) {
                location.href = "https://counter.dev/";
            }

            this.innerHTML = `
               <!-- Navbar -->
               <section class="navbar">
                 <div class="content">
                   <a href="index.html" class="logotype"></a>
                   <span class="version caption blue ml16">v 2.0</span>
                   <!-- Navigation -->
                   <nav class="nav-header">
                     <!-- <a href="#" class="mr32" target="_blank" rel="nofollow">Blog</a> -->
                     <a href="mailto:hey@counter.dev" class="mr32" target="_blank" rel="nofollow">Feedback</a>
                     <a href="https://www.paypal.com/donate/?hosted_button_id=GYAY2HGG2YLKL&locale.x=en_DE" class="mr32" target="_blank" rel="nofollow">Donate</a>
                     <a
                       href="https://github.com/ihucos/counter.dev"
                       class="github-blue mr16"
                       target="_blank"
                       rel="nofollow"
                     ></a>
                     <a
                       href="https://twitter.com/NaiveTeamHQ"
                       class="twitter-blue mr32"
                       target="_blank"
                       rel="nofollow"
                     ></a>
                     <div class="has-user dropdown" style="display: none">
                       <div class="profile-user fill-username"></div>
                       <div class="dropdown-content">
                         <a href="/dashboard">Dashboard</a>
                         <a href="#modal-account" rel="modal:open">Edit account</a>
                         <a href="/logout">Sign out</a>
                       </div>
                     </div>
                     <span class="no-user profile-guest" style="display: none">
                       <a href="welcome.html?sign-in" class="ml32 mr32">Log in</a>
                       <a href="welcome.html?sign-up" class="btn-primary">Sign up</a>
                     </span>
                     <!-- /// -->
                   </nav>
                   <!-- Hamburger -->
                   <div class="hamburger-menu">
                     <input id="hamburger-toggle" type="checkbox" />
                     <label class="hamburger-btn" for="hamburger-toggle"></label>
                     <div class="hamburger-box">
                       <div class="hamburger-content">
                         <img src="img/avatar.svg" width="96" height="96" alt="Avatar" />
                         <!-- Navigation -->
                         <nav class="nav-header-mob">
                           <!-- Guest -->
                           <span class="no-user mt48 mb48" style="display: none">
                             <a href="welcome.html?sign-in" class="btn-primary mr16">Log in</a>
                             <a href="welcome.html?sign-up" class="btn-secondary">Sign up</a>
                           </span>
                           <!-- User -->
                           <div class="has-user" style="display: none">
                             <div class="mt24 fill-username"></div>
                             <div class="mt24 mb48">
                               <a
                                 href="#modal-account"
                                 class="btn-primary mr16"
                                 rel="modal:open"
                                 onClick="document.getElementById('hamburger-toggle').checked=false"
                                 >Edit account</a
                               >
                               <a href="/logout" class="btn-secondary">Sign out</a>
                             </div>
                           </div>
                           <!-- /// -->
                           <!-- <a href="#" class="mb24" target="_blank" rel="nofollow"
                               >Blog</a
                           > -->
                           <a href="/dashboard" class="has-user mb24" target="_blank" rel="nofollow" style="display: none">
                             Dashboard
                           </a>
                           <a href="mailto:hey@counter.dev" class="mb24" target="_blank" rel="nofollow"
                             >Feedback</a
                           >
                           <a href="https://www.paypal.com/donate/?hosted_button_id=GYAY2HGG2YLKL&locale.x=en_DE" target="_blank" rel="nofollow">Donate</a>
                           <span class="mt48">
                             <a
                               href="https://github.com/ihucos/counter.dev"
                               class="github-blue mr24"
                               target="_blank"
                               rel="nofollow"
                             ></a>
                             <a
                               href="https://twitter.com/NaiveTeamHQ"
                               class="twitter-blue"
                               target="_blank"
                               rel="nofollow"
                             ></a>
                           </span>
                         </nav>
                       </div>
                     </div>
                   </div>
                 </div>
               </section>
               <base-editaccount></base-editaccount>`;
            this.loadUser();
        }
    }
);
