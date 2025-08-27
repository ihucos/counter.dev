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
                        <select class="width-full" name="timezone" id="timezone-select">
                          <option value="">Select your timezone</option>
                          ${this.TIMEZONES.map((tz) => `<option value="${escapeHtml(tz.value)}">${escapeHtml(tz.label)}</option>`).join("")}
                        </select>
                        <div class="caption mt8 text-muted">Choose your IANA timezone for accurate DST handling</div>
                        <!-- Hidden field for backward compatibility -->
                        <input type="hidden" name="utcoffset" value="${prefs.utcoffset || getUTCOffset()}" />
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

            // Handle timezone selection
            var timezone = prefs.timezone || "";
            var timezoneSelect = this.querySelector('#timezone-select');
            
            if (timezone) {
                timezoneSelect.value = timezone;
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
            useSitesEl.addEventListener("change", showHidePrefferedSites, false);

            var deleteRequest = this.querySelector(".delete-request");
            var deleteConfirm = this.querySelector(".delete-confirm");
            this.querySelector(".delete-request button").onclick = () => {
                deleteRequest.style.display = "none";
                deleteConfirm.style.display = "flex";
            };

            simpleForm("#account-edit", window.location.href.split("#")[0]);
            simpleForm(".delete-account .delete-confirm", "/");

            // redraw modal if it is closed
            $("#modal-account", this).on($.modal.AFTER_CLOSE, (event, modal) => {
                this.draw(prefs);
            });
        }

        TIMEZONES = [
            { value: "America/New_York", label: "Eastern Time (US & Canada)" },
            { value: "America/Chicago", label: "Central Time (US & Canada)" },
            { value: "America/Denver", label: "Mountain Time (US & Canada)" },
            { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
            { value: "America/Anchorage", label: "Alaska" },
            { value: "Pacific/Honolulu", label: "Hawaii" },
            { value: "America/Toronto", label: "Eastern Time (Canada)" },
            { value: "America/Vancouver", label: "Pacific Time (Canada)" },
            { value: "Europe/London", label: "London" },
            { value: "Europe/Paris", label: "Paris" },
            { value: "Europe/Berlin", label: "Berlin" },
            { value: "Europe/Rome", label: "Rome" },
            { value: "Europe/Moscow", label: "Moscow" },
            { value: "Asia/Tokyo", label: "Tokyo" },
            { value: "Asia/Shanghai", label: "Shanghai" },
            { value: "Asia/Seoul", label: "Seoul" },
            { value: "Asia/Singapore", label: "Singapore" },
            { value: "Asia/Dubai", label: "Dubai" },
            { value: "Asia/Kolkata", label: "Kolkata" },
            { value: "Australia/Sydney", label: "Sydney" },
            { value: "Australia/Melbourne", label: "Melbourne" },
            { value: "Pacific/Auckland", label: "Auckland" },
            { value: "America/Sao_Paulo", label: "São Paulo" },
            { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires" },
            { value: "America/Mexico_City", label: "Mexico City" },
            { value: "Africa/Cairo", label: "Cairo" },
            { value: "Africa/Johannesburg", label: "Johannesburg" },
            { value: "UTC", label: "UTC (Coordinated Universal Time)" },
        ];
    },
);
