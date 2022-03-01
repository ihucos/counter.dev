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
                    this.drawEditaccount(dump.user.prefs);
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

        drawEditaccount(prefs) {
            var ea = this.querySelector("base-editaccount");
            customElements.upgrade(ea);
            ea.draw(prefs);
        }

        connectedCallback() {

            fetch("/lang")
               .then(response => response.text())
               .then((response) => {
                   if (response == "ru"){
                        var text = `
<div style="width: 80%; padding: 0.75em;">
🇷🇺
 ❤️
🇧🇾
 ❤️
🇺🇦
 ❤️
🌎


                           <br/>
<br/>
                       Dear user,<br/>
<br/>
You are accessing the site from a Russian internet connection.<br/>
<br/>
The Russian government attacked the whole country of Ukraine with tanks, bombs, planes and foot soldiers. Many people already died, about 500.000 people fled to neighbourhood countries. There is no legitimate reason for this hostile action.<br/>
<br/>
The person who designs this product lives in Kyiv, hearing explosions and with the fear of not waking up the next morning.<br/>
<br/>
The Backend-Developer of this product is German and heavily disturbed by another war in Europe. I know the stories and reportings I am hearing, from history and my relatives.<br/>
<br/>
If you are Russian and can, please do your part. We need this useless war to stop. Put peaceful pressure on your government. Do what you can, make this stop, make it happen. Given the current situation we are giving you responsibility.<br/>
<br/>
May the world live in peace and unity, we are all the same.<br/>
<br /><br />
<i>Our mission at counter is to create simply a good product. But this topic is more important, for all of us. </i>
<br>
 <i>1 March 2022</i>
<br>
<br>
🕊
🕊
🕊


                           </div>`

                        $("<table id='overlay'><tbody><tr><td>" + text + "</td></tr></tbody></table>").css({
                            "position": "fixed",
                            "top": 0,
                            "left": 0,
                            "width": "100%",
                            "height": "100%",
                            "background-color": "rgba(0,0,0,.9)",
                            "z-index": 10000,
                            "vertical-align": "middle",
                            "text-align": "left",
                            "color": "#fff",
                            "font-size": "30px",
                            "font-weight": "bold",
                            "cursor": "wait"
                        }).appendTo("body");
                    }
               })
               .catch(err => console.log(err))


            // HACK: this should obviously not be in the navbar
            if (location.href.startsWith("https://simple-web-analytics.com")) {
                location.href = "https://counter.dev/";
            }

            this.innerHTML = `
               <!-- Navbar -->
               <section class="navbar">
                 <div class="content">
                   <a href="/index.html" class="logotype"></a>
                   <!-- Navigation -->
                   <nav class="nav-header">
                     <!-- <a href="#" class="mr32" target="_blank" rel="nofollow">Blog</a> -->
                     <a href="mailto:hey@counter.dev" class="mr32" target="_blank" rel="nofollow">Feedback</a>
                     <a href="https://www.paypal.com/donate/?hosted_button_id=3AV353CXCEN9E" class="mr32" target="_blank" rel="nofollow">Donate</a>
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
                           <a href="https://www.paypal.com/donate/?hosted_button_id=3AV353CXCEN9E" target="_blank" rel="nofollow">Donate</a>
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
