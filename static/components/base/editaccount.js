customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(prefs) {
            // Load dynamic timezone list (with offsets) once, then redraw
            if (this._tzReady !== "loaded") {
                if (this._tzReady !== "loading") {
                    this._tzReady = "loading";
                    fetch("/timezones.json", { cache: "no-store" })
                        .then((r) => r.json())
                        .then((data) => {
                            const parseOffsetMinutes = (currentOffset) => {
                                const token = (currentOffset || "").split(" ")[0];
                                const m = token.match(/^([+-])(\d{2})(?::?(\d{2}))?$/);
                                if (!m) return 0;
                                const sign = m[1] === "-" ? -1 : 1;
                                const hours = parseInt(m[2] || "0", 10);
                                const mins = parseInt(m[3] || "0", 10);
                                return sign * (hours * 60 + mins);
                            };
                            const buildLabel = (id, currentOffset) => {
                                const token = (currentOffset || "").split(" ")[0] || "+00";
                                const rest = (currentOffset || "").split(" ").slice(1).join(" ").trim();
                                const pretty = `UTC${token}`;
                                const suffix = rest ? ` ${rest}` : "";
                                return `${pretty}${suffix} — ${id}`;
                            };
                            const list = Array.isArray(data?.zones) ? data.zones : [];
                            const enriched = list
                                .map((z) => ({
                                    value: z.id,
                                    label: buildLabel(z.id, z.currentOffset),
                                    _minutes: parseOffsetMinutes(z.currentOffset),
                                }))
                                .filter((z) => typeof z.value === "string" && z.value)
                                .sort((a, b) => a._minutes - b._minutes || a.value.localeCompare(b.value));
                            if (enriched.length > 0) {
                                this.TIMEZONES = enriched.map(({ value, label }) => ({ value, label }));
                            }
                        })
                        .catch(() => {})
                        .finally(() => {
                            this._tzReady = "loaded";
                            this.draw(prefs);
                        });
                }
                return;
            }
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
                    <div class="title mb16" id="timezone-label">Time Zone</div>
                    <form action="/accountedit" id="account-edit" method="POST">
                        <select class="width-full" name="timezone" id="timezone-select" aria-labelledby="timezone-label" aria-describedby="timezone-help">
                          <option value="">Select your timezone</option>
                          ${this.TIMEZONES.map((tz) => `<option value="${escapeHtml(tz.value)}">${escapeHtml(tz.label)}</option>`).join("")}
                        </select>
                        <div class="caption mt8 text-muted" id="timezone-help">Choose your IANA timezone for accurate DST handling</div>
                        <!-- Hidden field for backward compatibility -->
                         <input type="hidden" name="utcoffset" value="${escapeHtml(String(prefs.utcoffset ?? getUTCOffset()))}" />
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
                          <button type="button" class="btn-white btn-danger btn-confirm">
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
            var timezoneSelect = this.querySelector("#timezone-select");
            var utcoffsetInput = this.querySelector('input[name="utcoffset"]');

            if (timezone) {
                timezoneSelect.value = timezone;
            } else if (Intl && Intl.DateTimeFormat) {
                const guess = Intl.DateTimeFormat().resolvedOptions().timeZone;
                if (this.TIMEZONES.some((t) => t.value === guess)) {
                    timezoneSelect.value = guess;
                }
            }
            timezoneSelect.addEventListener("change", () => {
                if (timezoneSelect.value) utcoffsetInput.value = "";
            });

            var sites = prefs.sites || "";
            var mail = prefs.mail || "";
            var useSites = prefs.usesites || "";
            var sitesEl = this.querySelector('textarea[name="sites"]');
            var useSitesEl = this.querySelector('select[name="usesites"]');
            var mailEl = this.querySelector('input[name="mail"]');

            useSitesEl.value = useSites;
            sitesEl.value = sites;
            mailEl.value = mail;

            const showHidePreferredSites = () => {
                if (useSitesEl.value === "") {
                    $(sitesEl.parentElement).slideUp();
                } else {
                    $(sitesEl.parentElement).slideDown();
                }
            };
            showHidePreferredSites();
            useSitesEl.addEventListener("change", showHidePreferredSites, false);

            var deleteRequest = this.querySelector(".delete-request");
            var deleteConfirm = this.querySelector(".delete-confirm");
            this.querySelector(".delete-request button").onclick = () => {
                deleteRequest.style.display = "none";
                deleteConfirm.style.display = "flex";
            };

            simpleForm("#account-edit", window.location.href.split("#")[0]);
            simpleForm(".delete-account .delete-confirm", "/");

            // redraw modal if it is closed
            $("#modal-account", this).on($.modal.AFTER_CLOSE, (_event, _modall) => {
                this.draw(prefs);
            });
        }

        TIMEZONES = [];
    },
);
