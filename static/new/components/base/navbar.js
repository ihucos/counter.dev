customElements.define(
    tagName(),
    class extends HTMLElement {
        escapeHtml(unsafe) {
            return (unsafe + "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        loadUser() {
            if (!document.cookie.includes("swa=")) {
                this.noUser();
                return;
            }

            var source = new EventSource("/dump");
            source.onmessage = (event) => {
                let dump = JSON.parse(event.data);
                if (!dump) {
                    this.noUser();
                } else {
                    this.hasUser(dump.user.id);
                }
                source.close(); // don't leave an open connection to server to save resources
            };
        }

        noUser() {
            document.getElementById("no-user").style.display = "block";
        }

        hasUser(user) {
            document.getElementById("has-user").style.display = "block";
            Array.from(
                document.getElementsByClassName("fill-username")
            ).forEach((el) => {
                el.innerHTML = this.escapeHtml(user);
            });
        }

        connectedCallback() {
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
                       href="https://twitter.com/DevCounter"
                       class="twitter-blue mr32"
                       target="_blank"
                       rel="nofollow"
                     ></a>
                     <div id="has-user" class="dropdown" style="display: none">
                       <div class="profile-user fill-username"></div>
                       <div class="dropdown-content">
                         <a href="/dashboard">Dashboard</a>
                         <a href="#modal-account" rel="modal:open">Edit account</a>
                         <a href="/logout2">Sign out</a>
                       </div>
                     </div>
                     <span id="no-user" class="profile-guest" style="display: none">
                       <a href="welcome.html?sign-in" class="ml32 mr32">Sign in</a>
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
                           <span class="mt48 mb48" style="display: none">
                             <a href="#" class="btn-primary mr16">Sign in</a>
                             <a href="#" class="btn-secondary">Sign up</a>
                           </span>
                           <!-- User -->
                           <span class="mt24 fill-username"></span>
                           <span class="mt24 mb48">
                             <a
                               href="#modal-account"
                               class="btn-primary mr16"
                               rel="modal:open"
                               onClick="document.getElementById('hamburger-toggle').checked=false"
                               >Edit account</a
                             >
                             <a href="#" class="btn-secondary">Sign out</a>
                           </span>
                           <!-- /// -->
                           <!-- <a href="#" class="mb24" target="_blank" rel="nofollow"
                             >Blog</a
                           > -->
                           <a href="#" class="mb24" target="_blank" rel="nofollow"
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
                               href="https://twitter.com/DevCounter"
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

                <!-- Edit account modal -->
                <div id="modal-account" style="display: none">
                  <div class="modal-header">
                    <img src="img/account.svg" width="24" height="24" alt="Edit account" />
                    <h3 class="ml16">Edit account</h3>
                    <a href="#" class="btn-close" rel="modal:close"></a>
                  </div>
                  <div class="modal-content">
                    <!-- Time zone -->
                    <div class="title mb16">Time zone</div>
                    <select class="width-full">
                      <option>(GMT-03:00) Buenos Aires, Georgetown</option>
                      <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                    </select>
                    <!-- Change password -->
                    <form action="/chgpwd" id="chgpwd" method="POST">
                        <div class="title mb8 mt24">Change password</div>
                        <label class="old-pass width-full"
                          >Old password<input
                            name="current_password"
                            class="width-full"
                            type="password"
                            placeholder="Old password"
                        /></label>
                        <div class="new-pass flex mb8 mt16">
                          <label class="width-half mr16"
                            >New password<input
                              name="new_password"
                              class="width-full"
                              type="password"
                              placeholder="New password"
                          /></label>
                          <label class="width-half"
                            >Repeat new password<input
                              name="repeat_new_password"
                              class="width-full"
                              type="password"
                              placeholder="Repeat new password"
                          /></label>
                        </div>
                        <span class="caption gray">We do not recover passwords!</span>
                        <div class="account-btn-group flex mt24 mb32">
                          <a href="#" class="btn-secondary full mr16" rel="modal:close"
                            >Cancel</a
                          >
                          <button type="submit" class="btn-primary full">Save</button>
                        </div>
                    </form>
                    <!-- Danger -->
                    <div class="delete-account">
                      <div class="title mb16">Account deleting</div>
                      <div class="danger gradient-red radius-lg">
                        <!-- Request delete -->
                        <div class="delete-request">
                          <div class="danger-message caption full mr16">
                            <img src="img/alert.svg" width="24" height="24" alt="Alert" />
                            <span class="ml16"
                              >Deleting your account removes all sites and stats you've
                              collected!</span
                            >
                          </div>
                          <button class="btn-white btn-danger btn-confirm">
                            Delete account
                          </button>
                        </div>
                        <!-- Confirm delete -->
                        <form action="/deleteUser" class="delete-confirm" method="POST" style="display: none">
                            <input
                              type="text"
                              class="confirm-input full mr16"
                              name="confirmUser"
                              placeholder="Enter username to confirm"
                            />
                            <button type="submit" class="btn-white btn-danger">Delete</button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>`;


            document.querySelector('.delete-account .delete-request button').onclick = ()=> {
                document.querySelector('.delete-account .delete-request').style.display = 'none'
                document.querySelector('.delete-account .delete-confirm').style.display = 'flex'
            }

            simpleForm('#chgpwd', "/logout2?next=login")
            simpleForm(".delete-account .delete-confirm", "/new")

            $('a[rel="modal:open"]', this).click(function (event) {
                $(this).modal({
                    fadeDuration: 200,
                    fadeDelay: 0,
                });
                return false;
            });
            this.loadUser();
        }
    }
);
