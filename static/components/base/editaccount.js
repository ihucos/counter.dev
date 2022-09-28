customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(prefs) {
            this.innerHTML = `

                <!-- Edit account modal -->
                <div id="modal-account" style="display: none">
                  <div class="modal-header">
                    <img src="/img/account.svg" width="24" height="24" alt="Edit account" />
                    <h3 class="ml16">Edit account</h3>
                    <a href="#" class="btn-close" rel="modal:close"></a>
                  </div>
                  <div class="modal-content">
                    <!-- Time zone -->
                    <div class="title mb16">Time Zone</div>
                    <form action="/accountedit" id="account-edit" method="POST">
                        <select class="width-full" name="utcoffset">
                          ${this.TIMEZONES.map(
                              (i) =>
                                  `<option value="${escapeHtml(
                                      i[0]
                                  )}">${escapeHtml(i[1])}</option>`
                          ).join("")}
                        </select>
                        <!-- Change password -->
                        <div class="title mb8 mt24">Change Password</div>
                        <label class="old-pass width-full"
                          >Current or temporary password<input
                            name="current_password"
                            class="width-full"
                            type="password"
                            placeholder="Valid password"
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
                        <!-- Mail -->
                        <div class="title mb8 mt24">Recover account</div>
                        <input
                            name="mail"
                            class="width-full"
                            type="email"
                            placeholder="Trusted E-Mail"
                        /></label>
                        <!-- Whitelist domains -->
                        <div class="title mb16 mt24">Listed Domains</div>

                            <select class="width-full" name="usesites">
                                  <option value="">
                                    Show all incoming traffic
                                  </option>
                                  <option value="1">
                                    Limit listed domains
                                  </option>
                            </select>
                            <label class="width-full mt16">Type here all your tracked domains separated by a space or newline<textarea
                                name="sites"
                                class="width-full"
                            ></textarea></label>
                        <div class="account-btn-group flex mt24 mb32">
                          <a href="#" class="btn-secondary full mr16" rel="modal:close"
                            >Cancel</a
                          >
                          <button type="submit" class="btn-primary full">Save</button>
                        </div>
                    </form>
                    <!-- Danger -->
                    <div class="delete-account">
                      <div class="title mb16">Delete account</div>
                      <div class="danger gradient-red radius-lg">
                        <!-- Request delete -->
                        <div class="delete-request">
                          <div class="danger-message caption full mr16">
                            <img src="/img/alert.svg" width="24" height="24" alt="Alert" />
                            <span class="ml16"
                              >Deleting your account removes all data you've
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

            var utcoffset = prefs.utcoffset || getUTCOffset();

            if (!isNaN(utcoffset)) {
                this.querySelector(`option[value="${utcoffset}"]`).setAttribute(
                    "selected",
                    "selected"
                );
            }

            var sites = prefs.sites || "";
            var mail = prefs.mail || "";
            var useSites = prefs.usesites || "";
            var sitesEl = this.querySelector('textarea[name="sites"]');
            var useSitesEl = this.querySelector('select[name="usesites"]');
            var mailEl = this.querySelector('input[name="mail"]');

            useSitesEl.value = useSites;
            sitesEl.value = sites;
            mailEl.value = mail;

            let showHidePrefferedSites = function () {
                if (useSitesEl.value === "") {
                    $(sitesEl.parentElement).slideUp();
                } else {
                    $(sitesEl.parentElement).slideDown();
                }
            };
            showHidePrefferedSites();
            useSitesEl.addEventListener(
                "change",
                showHidePrefferedSites,
                false
            );

            var deleteRequest = this.querySelector(".delete-request");
            var deleteConfirm = this.querySelector(".delete-confirm");
            this.querySelector(".delete-request button").onclick = () => {
                deleteRequest.style.display = "none";
                deleteConfirm.style.display = "flex";
            };

            simpleForm("#account-edit", window.location.href.split("#")[0]);
            simpleForm(".delete-account .delete-confirm", "/");

            // redraw modal if it is closed
            $("#modal-account", this).on(
                $.modal.AFTER_CLOSE,
                (event, modal) => {
                    this.draw(prefs);
                }
            );
        }

        TIMEZONES = [
            [-12, "[UTC-12:00] United States Minor Outlying Islands"],
            [-11, "[UTC-11:00] United States Minor Outlying Islands"],
            [-10, "[UTC-10:00] Honolulu"],
            [-9, "[UTC-09:00] Anchorage"],
            [-8, "[UTC-08:00] Los Angeles, Vancouver, Tijuana"],
            [-7, "[UTC-07:00] Denver, Edmonton, Ciudad Juárez"],
            [-6, "[UTC-06:00] Mexico City, Chicago, Guatemala City"],
            [-5, "[UTC-05:00] New York, Toronto, Bogotá"],
            [-4, "[UTC-04:00] Santiago, Santo Domingo, Manaus"],
            [-3, "[UTC-03:00] São Paulo, Buenos Aires, Montevideo"],
            [-2, "[UTC-02:00] Fernando de Noronha"],
            [-1, "[UTC-01:00] Cape Verde, Azores islands"],
            [0, "[UTC+00:00] London, Dublin, Lisbon"],
            [1, "[UTC+01:00] Berlin, Rome, Paris"],
            [2, "[UTC+02:00] Cairo, Johannesburg, Khartoum"],
            [3, "[UTC+03:00] Moscow, Istanbul, Riyadh"],
            [4, "[UTC+04:00] Dubai, Baku, Tbilisi"],
            [5, "[UTC+05:00] Karachi, Tashkent, Yekaterinburg"],
            [6, "[UTC+06:00] Dhaka, Almaty, Omsk"],
            [7, "[UTC+07:00] Jakarta, Ho Chi Minh City, Bangkok"],
            [8, "[UTC+08:00] Shanghai, Taipei, Kuala Lumpur"],
            [9, "[UTC+09:00] Tokyo, Seoul, Pyongyang, Ambon"],
            [10, "[UTC+10:00] Sydney, Port Moresby, Vladivostok"],
            [11, "[UTC+11:00] Nouméa, Magadan"],
            [12, "[UTC+12:00] Auckland, Suva, Petropavlovsk-Kamchatsky"],
            [13, "[UTC+13:00] Phoenix Islands, Samoa"],
            [14, "[UTC+14:00] Line Islands"],
        ];
    }
);
