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

            document.addEventListener("push-navbar-nouser", () => {
                this.eventPushNavbarNouserCalled = true
                this.noUser();
                // don't leave an open connection to server to save resources
                eventSourceObj.close();
            });
            document.addEventListener("push-navbar-dump", (evt) => {
                let dump = evt.detail;
                this.eventPushNavbarDumpCalled = true
                this.hasUser(dump.user.id);
                sessionStorage.setItem(usernameCacheKey, dump.user.id);
                // the fallback is because older user's dont set the
                // utcoffset by default
                this.drawEditaccount(dump.user.prefs);

                // Adapt the feedback form mail input field
                if (dump.user.prefs.mail){
                    document.getElementById("feedback-mail").setAttribute("value", dump.user.prefs.mail)
                    document.getElementById("feedback-mail").setAttribute("type", "hidden")
                }

                document.dispatchEvent(new CustomEvent("userloaded"));
                // don't leave an open connection to server to save resources
                eventSourceObj.close();
            });
            var eventSourceObj = dispatchPushEvents("/dump", "push-navbar-");
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
                .then((response) => response.text())
                .then((response) => {
                    if (response == "RU") {
                        var text = `
<div style="width: 80%; padding: 0.75em;">
 ❤️
🇷🇺
 ❤️
🇺🇦
 ❤️


                           <br/>
<br/>
                       Dear user,<br/>
<br/>
You are accessing this site from a Russian internet connection.<br/>
<br/>
If you are against the war, apologies for the inconvenience. If you support the war, Слава Україні.
<br/>
<br/>
Let's hope this madness stops eventually and things become more normal.
<br>
<br/>
<br/>
🕊
🕊
🕊


                           </div>`;

                        $(
                            "<table id='overlay'><tbody><tr><td>" +
                                text +
                                "</td></tr></tbody></table>"
                        )
                            .css({
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                "background-color": "rgba(0,0,0,.9)",
                                "z-index": 10000,
                                "vertical-align": "middle",
                                "text-align": "left",
                                color: "#fff",
                                "font-size": "30px",
                                "font-weight": "bold",
                                cursor: "wait",
                            })
                            .appendTo("body");
                    }
                })
                .catch((err) => console.log(err));

            // HACK: this should obviously not be in the navbar
            if (location.href.startsWith("https://simple-web-analytics.com")) {
                location.href = "https://counter.dev/";
            }

            this.innerHTML = `
               <!-- Navbar -->
               <section class="navbar">

                 <!-- Feedback modal -->
                 <div id="modal-feedback" style="display: none">
                   <div class="modal-header">
                     <img src="/img/feedback.svg" width="24" height="24" alt="Feedback" />
                     <h3 class="ml16">Feedback</h3>
                     <a href="#" class="btn-close" rel="modal:close"></a>
                   </div>
                   <div class="modal-content">
                     <form action="/feedback" method="POST">
                       <label class="width-full">How can we make the service better for you?
                         <textarea class="width-full" name="feedback" style="min-height: 200px;"></textarea>
                         <input id="feedback-mail" type="email" name="contact" placeholder="Mail to receive reply (optional)" class="width-full"></input>
                       </label>
                       <div class="account-btn-group flex mt24 mb32">
                         <a href="#" class="btn-secondary full mr16" rel="modal:close">
                           Cancel
                         </a>
                         <button type="submit" class="btn-primary full">Send</button>
                       </div>

                     </form>
                   </div>
                 </div>

                 <div class="content">
                   <a href="/index.html" class="logotype"></a>
                   <!-- Navigation -->
                   <nav class="nav-header">
                     <a href="/help/" class="mr32">Help</a>
                     <a href="/blog" class="mr32">Blog</a>
                     <a href="#modal-feedback" class="mr32" target="_blank" rel="modal:open">Feedback</a>
                     <a
                       href="https://github.com/ihucos/counter.dev"
                       class="github-blue mr16"
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
                       <a href="/welcome.html?sign-in" class="ml32 mr32">Log in</a>
                       <a href="/welcome.html?sign-up" class="btn-primary">Sign up</a>
                     </span>
                     <!-- /// -->
                   </nav>
                   <!-- Hamburger -->
                   <div class="hamburger-menu">
                     <input id="hamburger-toggle" type="checkbox" />
                     <label class="hamburger-btn" for="hamburger-toggle"></label>
                     <div class="hamburger-box">
                       <div class="hamburger-content">
                         <img src="/img/avatar.svg" width="96" height="96" alt="Avatar" />
                         <!-- Navigation -->
                         <nav class="nav-header-mob">
                           <!-- Guest -->
                           <span class="no-user mt48 mb48" style="display: none">
                             <a href="/welcome.html?sign-in" class="btn-primary mr16">Log in</a>
                             <a href="/welcome.html?sign-up" class="btn-secondary">Sign up</a>
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
                           <a href="/blog" class="mb24">Blog</a>
                           <a href="/dashboard" class="has-user mb24" target="_blank" rel="nofollow" style="display: none">
                             Dashboard
                           </a>
                           <a href="mailto:hey@counter.dev" class="mb24" target="_blank" rel="nofollow"
                             >Feedback</a
                           >
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
            simpleForm("#modal-feedback form", (msg)=>{
                $.modal.close()
                notify(msg)
            })
        }

        loggedInUserCallback(loggedInCb, notLoggedInCb){
            var calledLoggedInCb = false
            var calledNotLoggedInCb = false
            document.addEventListener("push-navbar-dump", (evt) => {
                 if (!calledLoggedInCb) loggedInCb(evt.detail)
                 calledLoggedInCb = true
            })
            document.addEventListener("push-navbar-nouser", (evt) => {
                    if (!calledNotLoggedInCb) notLoggedInCb()
                    calledNotLoggedInCb = true
            })
            if (this.eventPushNavbarNouserCalled){
                if (!calledNotLoggedInCb) notLoggedInCb()
                calledNotLoggedInCb = true
            }
            if (this.eventPushNavbarDumpCalled){
                 if (!calledLoggedInCb) loggedInCb(this.savedUserDump)
                 calledLoggedInCb = true
			};
        }
    }
);
