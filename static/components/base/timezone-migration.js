customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(userDump) {
            // Load timezone list once for nice labels with offsets
            if (this._tzReady !== 'loaded') {
                if (this._tzReady !== 'loading') {
                    this._tzReady = 'loading';
                    fetch('/timezones.json', { cache: 'no-store' })
                        .then((r) => r.json())
                        .then((data) => {
                            const zones = Array.isArray(data?.zones) ? data.zones : [];
                            this._tzMap = Object.fromEntries(zones.map((z) => [z.id, z.currentOffset]));
                        })
                        .catch(() => {})
                        .finally(() => {
                            this._tzReady = 'loaded';
                            this.draw(userDump);
                        });
                }
                return;
            }
            // Only show if user needs timezone update
            if (!userDump.prefs.needsTimezoneUpdate) {
                this.style.display = "none";
                return;
            }

            const suggestions = userDump.prefs.suggestedTimezones?.split(",") || [];
            const currentOffset = userDump.prefs.utcoffset || "0";

            this.innerHTML = `
				<div class="timezone-migration-banner gradient-blue radius-lg p16 mb16">
					<div class="flex items-center">
						<img src="/img/info.svg" width="24" height="24" alt="Info" />
						<div class="ml16 flex-1">
							<div class="font-bold mb4">Upgrade to Better Timezone Handling</div>
							<div class="caption mb8">
								Your current timezone is set to UTC${currentOffset >= 0 ? "+" : ""}${currentOffset}.
								We now support precise IANA timezones with automatic daylight saving time adjustments.
							</div>
							${
                suggestions.length > 0
                    ? `
							<div class="mb8">
								<span class="caption-strong">Suggested timezones for your region:</span>
							</div>
							<div class="timezone-suggestions flex flex-wrap gap8 mb12">
								${suggestions
                                .map(
                                    (tz) => `
									<button class="btn-secondary-sm timezone-suggestion" data-timezone="${tz}">
										${this.formatTimezone(tz)}
									</button>
								`,
                                )
                                .join("")}
							</div>
						`
                    : ""
            }
							<div class="flex gap8">
								<button class="btn-secondary-sm" id="timezone-update-manual">
									Choose Different Timezone
								</button>
								<button class="btn-secondary-sm" id="timezone-dismiss">
									Keep Current Setting
								</button>
							</div>
						</div>
						<button class="btn-close ml16" id="timezone-close">×</button>
					</div>
				</div>
			`;

            // Add event listeners
            this.querySelectorAll(".timezone-suggestion").forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const timezone = e.target.dataset.timezone;
                    this.updateTimezone(timezone);
                });
            });

            const manualBtn = this.querySelector("#timezone-update-manual");
            if (manualBtn) {
                manualBtn.addEventListener("click", () => {
                    this.openAccountSettings();
                });
            }

            const dismissBtn = this.querySelector("#timezone-dismiss");
            if (dismissBtn) {
                dismissBtn.addEventListener("click", () => {
                    this.dismissMigration();
                });
            }

            const closeBtn = this.querySelector("#timezone-close");
            if (closeBtn) {
                closeBtn.addEventListener("click", () => {
                    this.hide();
                });
            }
        }

        formatTimezone(timezone) {
            // Prefer rich label with current offset if available
            const currentOffset = this._tzMap?.[timezone];
            if (currentOffset) {
                const token = (currentOffset || '').split(' ')[0] || '+00';
                const rest = (currentOffset || '').split(' ').slice(1).join(' ').trim();
                const pretty = `UTC${token}`;
                const suffix = rest ? ` ${rest}` : '';
                return `${pretty}${suffix} — ${timezone}`;
            }

            // Fallback: humanize the zone id
            return timezone.split("/").pop().replace(/_/g, " ");
        }

        updateTimezone(timezone) {
            // Send timezone update to server
            const formData = new FormData();
            formData.append("timezone", timezone);

            fetch("/accountedit", {
                method: "POST",
                body: formData,
            })
                .then((response) => {
                    if (response.ok) {
                        // Reload the page to refresh with new timezone
                        window.location.reload();
                    } else {
                        console.error("Failed to update timezone");
                    }
                })
                .catch((error) => {
                    console.error("Error updating timezone:", error);
                });
        }

        openAccountSettings() {
            // Trigger account settings modal
            const accountModal = document.querySelector("base-editaccount");
            if (accountModal) {
                $("#modal-account").modal("show");
            }
        }

        dismissMigration() {
            // Mark migration as dismissed (could store in localStorage)
            localStorage.setItem("timezone-migration-dismissed", "true");
            this.hide();
        }

        hide() {
            this.style.display = "none";
        }
    },
);
