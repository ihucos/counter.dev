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
                    // the fallback is because older user's dont set the
                    // timezone by default
                    this.setTimezone(dump.user.prefs.timezone || getUTCOffset())
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

        setTimezone(timezone){
            if (!isNaN(timezone)){  // just validation
                document.querySelector(`#account-edit option[value="${timezone}"]`).setAttribute('selected', 'selected')
            }
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
                     <a href="//flattr.com/@ihucos" class="mr32" target="_blank" rel="nofollow">Donate</a>
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
                           <a href="#" target="_blank" rel="nofollow">Donate</a>
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
                    <form action="/accountedit" id="account-edit" method="POST">
                        <select class="width-full" name="utcoffset">
                          ${this.TIME_ZONES.map((i)=>`<option value="${this.escapeHtml(i[0])}">${this.escapeHtml(i[1])}</option>`).join('')}
                        </select>
                        <!-- Change password -->
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

            simpleForm('#account-edit', window.location.href)
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

        TIME_ZONES = [

            [-12, '[UTC-12:00] United States Minor Outlying Islands'],
            [-11, '[UTC-11:00] United States Minor Outlying Islands'],
            [-10, '[UTC-10:00] Honolulu'],
            [-9,  '[UTC-09:00] Anchorage'],
            [-8,  '[UTC-08:00] Los Angeles, Vancouver, Tijuana'],
            [-7,  '[UTC-07:00] Denver, Edmonton, Ciudad Juárez'],
            [-6,  '[UTC-06:00] Mexico City, Chicago, Guatemala City'],
            [-5,  '[UTC-05:00] New York, Toronto, Bogotá'],
            [-4,  '[UTC-04:00] Santiago, Santo Domingo, Manaus'],
            [-3,  '[UTC-03:00] São Paulo, Buenos Aires, Montevideo'],
            [-2,  '[UTC-02:00] Fernando de Noronha'],
            [-1,  '[UTC-01:00] Cape Verde, Azores islands'],
            [0,   '[UTC+00:00] London, Dublin, Lisbon'],
            [1,   '[UTC+01:00] Berlin, Rome, Paris'],
            [2,   '[UTC+02:00] Cairo, Johannesburg, Khartoum'],
            [3,   '[UTC+03:00] Moscow, Istanbul, Riyadh'],
            [4,   '[UTC+04:00] Dubai, Baku, Tbilisi'],
            [5,   '[UTC+05:00] Karachi, Tashkent, Yekaterinburg'],
            [6,   '[UTC+06:00] Dhaka, Almaty, Omsk'],
            [7,   '[UTC+07:00] Jakarta, Ho Chi Minh City, Bangkok'],
            [8,   '[UTC+08:00] Shanghai, Taipei, Kuala Lumpur'],
            [9,   '[UTC+09:00] Tokyo, Seoul, Pyongyang, Ambon'],
            [10,  '[UTC+10:00] Sydney, Port Moresby, Vladivostok'],
            [11,  '[UTC+11:00] Nouméa, Magadan'],
            [12,  '[UTC+12:00] Auckland, Suva, Petropavlovsk-Kamchatsky'],
            [13,  '[UTC+13:00] Phoenix Islands, Samoa'],
            [14,  '[UTC+14:00] Line Islands']
        ]
    }
);
