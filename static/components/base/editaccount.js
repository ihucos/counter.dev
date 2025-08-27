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
			var timezoneSelect = this.querySelector("#timezone-select");

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

			const showHidePrefferedSites = () => {
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
			$("#modal-account", this).on($.modal.AFTER_CLOSE, (_event,_modall) => {
				this.draw(prefs);
			});
		}

        TIMEZONES = [
            // UTC-12
            { value: "Etc/GMT+12", label: "(UTC-12:00) International Date Line West (no local time)" },

            // UTC-11
            { value: "Pacific/Pago_Pago", label: "(UTC-11:00) American Samoa" }, // replaces Pacific/Midway

            // UTC-10
            { value: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii" },

            // UTC-9:30
            { value: "Pacific/Marquesas", label: "(UTC-09:30) Marquesas Islands" },

            // UTC-9
            { value: "America/Anchorage", label: "(UTC-09:00) Alaska" },

            // UTC-8
            { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US)" },
            { value: "America/Vancouver", label: "(UTC-08:00) Pacific Time (Canada)" },
            { value: "America/Tijuana", label: "(UTC-08:00) Tijuana" },

            // UTC-7
            { value: "America/Denver", label: "(UTC-07:00) Mountain Time (US & Canada)" },
            { value: "America/Phoenix", label: "(UTC-07:00) Arizona (no DST)" },
            { value: "America/Hermosillo", label: "(UTC-07:00) Sonora (no DST)" },
            { value: "America/Chihuahua", label: "(UTC-07:00) Chihuahua (MX, most of state)" },
            { value: "America/Mazatlan", label: "(UTC-07:00) Mazatlán, La Paz (MX Pacific)" },
            // (Optional if you care about border behavior)
            { value: "America/Ciudad_Juarez", label: "(UTC-07:00/UTC-06:00) Ciudad Juárez (MX, US-aligned DST)" },

            // UTC-6
            { value: "America/Chicago", label: "(UTC-06:00) Central Time (US)" },
            { value: "America/Regina", label: "(UTC-06:00) Saskatchewan (no DST)" },
            { value: "America/Mexico_City", label: "(UTC-06:00) Mexico City" },
            { value: "America/Guatemala", label: "(UTC-06:00) Central America" },

            // UTC-5
            { value: "America/New_York", label: "(UTC-05:00) Eastern Time (US)" },
            { value: "America/Toronto", label: "(UTC-05:00) Eastern Time (Canada)" },
            { value: "America/Bogota", label: "(UTC-05:00) Bogotá" },
            { value: "America/Lima", label: "(UTC-05:00) Lima" },
            { value: "America/Guayaquil", label: "(UTC-05:00) Quito/Guayaquil" },
            { value: "America/Indiana/Indianapolis", label: "(UTC-05:00) Indiana (East)" },

            // UTC-4
            { value: "America/Halifax", label: "(UTC-04:00) Atlantic Time (Canada)" },
            { value: "America/Puerto_Rico", label: "(UTC-04:00) Puerto Rico" },
            { value: "America/Caracas", label: "(UTC-04:00) Caracas" },
            { value: "America/Santiago", label: "(UTC-04:00) Santiago" },

            // UTC-3:30
            { value: "America/St_Johns", label: "(UTC-03:30) Newfoundland" },

            // UTC-3
            { value: "America/Sao_Paulo", label: "(UTC-03:00) Brasília" },
            { value: "America/Argentina/Buenos_Aires", label: "(UTC-03:00) Buenos Aires" },
            { value: "America/Montevideo", label: "(UTC-03:00) Montevideo" },

            // UTC-2
            { value: "America/Noronha", label: "(UTC-02:00) Fernando de Noronha" },
            { value: "Atlantic/South_Georgia", label: "(UTC-02:00) South Georgia" },

            // UTC-1
            { value: "Atlantic/Azores", label: "(UTC-01:00) Azores" },
            { value: "Atlantic/Cape_Verde", label: "(UTC-01:00) Cabo Verde" },

            // UTC+0
            { value: "Etc/UTC", label: "(UTC+00:00) Coordinated Universal Time" },
            { value: "Europe/London", label: "(UTC+00:00) London" },
            { value: "Europe/Dublin", label: "(UTC+00:00) Dublin" },
            { value: "Europe/Lisbon", label: "(UTC+00:00) Lisbon" },
            { value: "Atlantic/Canary", label: "(UTC+00:00) Canary Islands" },
            { value: "Africa/Monrovia", label: "(UTC+00:00) Monrovia" },

            // UTC+1
            { value: "Europe/Paris", label: "(UTC+01:00) Paris, Madrid" },
            { value: "Europe/Berlin", label: "(UTC+01:00) Berlin" },
            { value: "Europe/Rome", label: "(UTC+01:00) Rome" },
            { value: "Europe/Amsterdam", label: "(UTC+01:00) Amsterdam, Brussels" },
            { value: "Africa/Lagos", label: "(UTC+01:00) West Africa" },
            { value: "Africa/Casablanca", label: "(UTC+01:00) Casablanca (Ramadan UTC+00:00)" },

            // UTC+2
            { value: "Europe/Helsinki", label: "(UTC+02:00) Helsinki" },
            { value: "Europe/Kyiv", label: "(UTC+02:00) Kyiv" },
            { value: "Europe/Riga", label: "(UTC+02:00) Riga" },
            { value: "Europe/Athens", label: "(UTC+02:00) Athens, Bucharest" },
            { value: "Africa/Cairo", label: "(UTC+02:00) Cairo" },
            { value: "Africa/Johannesburg", label: "(UTC+02:00) Johannesburg, Pretoria" },
            { value: "Asia/Jerusalem", label: "(UTC+02:00) Jerusalem" },

            // UTC+3
            { value: "Europe/Moscow", label: "(UTC+03:00) Moscow" },
            { value: "Europe/Istanbul", label: "(UTC+03:00) Istanbul" },
            { value: "Asia/Baghdad", label: "(UTC+03:00) Baghdad" },
            { value: "Asia/Riyadh", label: "(UTC+03:00) Riyadh" },
            { value: "Africa/Nairobi", label: "(UTC+03:00) Nairobi" },

            // UTC+3:30
            { value: "Asia/Tehran", label: "(UTC+03:30) Tehran" },

            // UTC+4
            { value: "Asia/Dubai", label: "(UTC+04:00) Dubai, Abu Dhabi" },
            { value: "Asia/Baku", label: "(UTC+04:00) Baku" },
            { value: "Asia/Tbilisi", label: "(UTC+04:00) Tbilisi" },
            { value: "Asia/Yerevan", label: "(UTC+04:00) Yerevan" },

            // UTC+4:30
            { value: "Asia/Kabul", label: "(UTC+04:30) Kabul" },

            // UTC+5
            { value: "Asia/Karachi", label: "(UTC+05:00) Karachi" },
            { value: "Asia/Tashkent", label: "(UTC+05:00) Tashkent" },
            { value: "Asia/Almaty", label: "(UTC+05:00) Almaty" }, // moved from +6 in 2024

            // UTC+5:30
            { value: "Asia/Kolkata", label: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
            { value: "Asia/Colombo", label: "(UTC+05:30) Colombo" },

            // UTC+5:45
            { value: "Asia/Kathmandu", label: "(UTC+05:45) Kathmandu" },

            // UTC+6
            { value: "Asia/Dhaka", label: "(UTC+06:00) Dhaka" },

            // UTC+6:30
            { value: "Asia/Yangon", label: "(UTC+06:30) Yangon" },

            // UTC+7
            { value: "Asia/Bangkok", label: "(UTC+07:00) Bangkok, Hanoi" },
            { value: "Asia/Ho_Chi_Minh", label: "(UTC+07:00) Ho Chi Minh City" },
            { value: "Asia/Jakarta", label: "(UTC+07:00) Jakarta" },
            { value: "Asia/Novosibirsk", label: "(UTC+07:00) Novosibirsk" },

            // UTC+8
            { value: "Asia/Shanghai", label: "(UTC+08:00) Beijing, Shanghai" },
            { value: "Asia/Hong_Kong", label: "(UTC+08:00) Hong Kong" },
            { value: "Asia/Singapore", label: "(UTC+08:00) Singapore" },
            { value: "Asia/Taipei", label: "(UTC+08:00) Taipei" },
            { value: "Australia/Perth", label: "(UTC+08:00) Perth" },

            // UTC+8:45 (optional quirky AU zone)
            // { value: "Australia/Eucla",     label: "(UTC+08:45) Eucla" },

            // UTC+9
            { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo, Osaka" },
            { value: "Asia/Seoul", label: "(UTC+09:00) Seoul" },

            // UTC+9:30
            { value: "Australia/Adelaide", label: "(UTC+09:30) Adelaide" },
            { value: "Australia/Darwin", label: "(UTC+09:30) Darwin" },

            // UTC+10
            { value: "Australia/Sydney", label: "(UTC+10:00) Sydney, Melbourne" },
            { value: "Australia/Brisbane", label: "(UTC+10:00) Brisbane" },
            { value: "Australia/Hobart", label: "(UTC+10:00) Hobart" },
            { value: "Pacific/Port_Moresby", label: "(UTC+10:00) Port Moresby" },
            { value: "Pacific/Guam", label: "(UTC+10:00) Guam" },

            // UTC+10:30
            { value: "Australia/Lord_Howe", label: "(UTC+10:30/UTC+11:00) Lord Howe Island" },

            // UTC+11
            { value: "Pacific/Noumea", label: "(UTC+11:00) New Caledonia" },

            // UTC+12
            { value: "Pacific/Auckland", label: "(UTC+12:00) Auckland, Wellington" },
            { value: "Pacific/Chatham", label: "(UTC+12:45) Chatham Islands" },
            { value: "Pacific/Fiji", label: "(UTC+12:00) Fiji" },
            { value: "Pacific/Kwajalein", label: "(UTC+12:00) Kwajalein" }, // correct location

            // UTC+13
            { value: "Pacific/Tongatapu", label: "(UTC+13:00) Nuku'alofa" },
            { value: "Pacific/Apia", label: "(UTC+13:00) Samoa" },

            // UTC+14
            { value: "Pacific/Kiritimati", label: "(UTC+14:00) Kiritimati" },
        ];

	},
);
