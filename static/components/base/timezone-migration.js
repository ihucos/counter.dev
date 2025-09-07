customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(userDump) {
            // Load timezone list once for nice labels with offsets
            if (this._tzReady !== "loaded") {
                if (this._tzReady !== "loading") {
                    this._tzReady = "loading";
                    fetch("/timezones.json", { cache: "no-store" })
                        .then((r) => r.json())
                        .then((data) => {
                            const zones = Array.isArray(data?.zones) ? data.zones : [];
                            // Build maps for label rendering
                            this._tzInfo = Object.fromEntries(zones.map((z) => [z.id, z]));
                            this._currentOffsetById = Object.fromEntries(zones.map((z) => [z.id, z.currentOffset]));
                        })
                        .catch(() => {})
                        .finally(() => {
                            this._tzReady = "loaded";
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
            if (localStorage.getItem("timezone-migration-dismissed") === "true") {
                this.style.display = "none";
                return;
            }

            const suggestions = userDump.prefs.suggestedTimezones?.split(",").filter(Boolean) || [];
            const currentOffsetRaw = String(userDump.prefs.utcoffset ?? "0");
            const offsetSign = currentOffsetRaw.startsWith("-") ? "" : "+";

            this.innerHTML = `
                <div id="modal-timezone-migration" style="display: none">
                  <div class="modal-header">
                    <img src="/img/info.svg" width="24" height="24" alt="Timezone migration" />
                    <h3 class="ml16">Upgrade to Better Timezone Handling</h3>
                    <a href="#" class="btn-close" rel="modal:close"></a>
                  </div>
                  <div class="modal-content">
                    <div class="caption mb8">
                      Your current timezone is set to UTC${offsetSign}${this.escapeHtml(currentOffsetRaw)}. We now support precise IANA timezones with automatic daylight saving time adjustments.
                    </div>
                    ${(() => {
                        if (suggestions.length === 0) return "";
                        const initial = this._pickOnePerContinent(suggestions);
                        const remainingCount = Math.max(0, suggestions.length - initial.length);
                        return `
                        <div class="mb8">
                          <span class="caption-strong">Suggested timezones for your region:</span>
                        </div>
                        <div class="timezone-suggestions flex flex-wrap gap8 mb12" id="tz-suggestions-initial">
                          ${this._renderSuggestions(initial)}
                        </div>
                        ${remainingCount > 0 ? `
                          <div class="timezone-suggestions flex flex-wrap gap8 mb12" id="tz-suggestions-more" style="display:none;">
                            ${this._renderSuggestions(suggestions)}
                          </div>
                          <div class="mb16">
                            <button class="btn-secondary-sm" type="button" id="timezone-show-more">Show more (${remainingCount})</button>
                          </div>
                        ` : ""}
                        `;
                    })()}
                    <div class="flex gap8">
                      <button class="btn-secondary-sm" id="timezone-update-manual" type="button" style="white-space: nowrap;">Choose Different Timezone</button>
                      <button class="btn-secondary-sm" id="timezone-dismiss" type="button" style="white-space: nowrap;">Keep Current Setting</button>
                    </div>
                  </div>
                </div>`;

            // Open modal
            const $modal = $("#modal-timezone-migration", this);
            $modal.modal({ closeExisting: false });

            // Use delegated handlers because jquery-modal may move the element in the DOM
            $(document)
                .off("click.timezone-migration")
                .on("click.timezone-migration", "#modal-timezone-migration .timezone-suggestion", (e) => {
                    const timezone = e.currentTarget.dataset.timezone;
                    this.updateTimezone(timezone);
                })
                .on("click.timezone-migration", "#modal-timezone-migration #timezone-update-manual", () => {
                    $.modal.close();
                    setTimeout(() => this.openAccountSettings(), 0);
                })
                .on("click.timezone-migration", "#modal-timezone-migration #timezone-dismiss", () => {
                    this.dismissMigration();
                    $.modal.close();
                })
                .on("click.timezone-migration", "#modal-timezone-migration #timezone-show-more", (e) => {
                    const btn = e.currentTarget;
                    const initial = document.getElementById("tz-suggestions-initial");
                    const more = document.getElementById("tz-suggestions-more");
                    if (!initial || !more) return;
                    if (more.style.display === "none") {
                        more.style.display = "flex";
                        initial.style.display = "none";
                        btn.textContent = "Show less";
                    } else {
                        more.style.display = "none";
                        initial.style.display = "flex";
                        // Recompute remaining count from data attribute if needed
                        const remaining = (more.querySelectorAll(".timezone-suggestion").length - initial.querySelectorAll(".timezone-suggestion").length);
                        btn.textContent = remaining > 0 ? `Show more (${remaining})` : "Show more";
                    }
                });

            // Cleanup listeners after close
            $(document).on("modal:after-close.timezone-migration", "#modal-timezone-migration", () => {
                $(document).off(".timezone-migration");
            });
        }

        _pickOnePerContinent(ids) {
            const seen = new Set();
            const picked = [];
            for (const id of ids) {
                const info = this._tzInfo?.[id];
                const continent = info?.continent || (id.includes("/") ? id.split("/")[0] : "");
                if (!continent) continue;
                if (!seen.has(continent)) {
                    seen.add(continent);
                    picked.push(id);
                }
            }
            return picked;
        }

        _renderSuggestions(list) {
            const uniq = Array.from(new Set(list));
            return uniq
                .map((id) => {
                    const info = this._tzInfo?.[id] || {};
                    // If this is a canonical row and we have an alias with a friendlier displayId, use that
                    const displayId = info.displayId || id;
                    // Map to currentOffset using the displayId/id we have
                    const offset = this._currentOffsetById?.[displayId] || this._currentOffsetById?.[id] || "";
                    const token = (offset || "").split(" ")[0] || "+00";
                    const rest = (offset || "").split(" ").slice(1).join(" ").trim();
                    const pretty = `UTC${token}`;
                    const suffix = rest ? ` ${rest}` : "";
                    const label = `${this.escapeHtml(pretty)}${this.escapeHtml(suffix ? ` ${suffix}` : "")} — ${this.escapeHtml(displayId)}`;
                    // Submit the canonical-or-alias IANA id that the backend accepts
                    const submitId = displayId;
                    return `<button class="btn-secondary-sm timezone-suggestion" type="button" data-timezone="${this.escapeHtml(submitId)}">${label}</button>`;
                })
                .join("");
        }

        // Local HTML-escaping helper to avoid ReferenceError and XSS
        escapeHtml(val) {
            const str = `${val}`;
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return str.replace(/[&<>"']/g, (ch) => map[ch]);
        }

        formatTimezone(timezone) {
            // Prefer rich label with current offset if available
            const currentOffset = this._currentOffsetById?.[timezone];
            if (currentOffset) {
                const token = (currentOffset || "").split(" ")[0] || "+00";
                const rest = (currentOffset || "").split(" ").slice(1).join(" ").trim();
                const pretty = `UTC${token}`;
                const suffix = rest ? ` ${rest}` : "";
                return `${pretty}${suffix} — ${timezone}`;
            }

            // Fallback: humanize the zone id
            return timezone.split("/").pop().replace(/_/g, " ");
        }

        updateTimezone(timezone) {
            // Send timezone update to server
            const formData = new FormData();
            formData.append("timezone", timezone);
            const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
            if (csrf) formData.append("csrf_token", csrf);

            fetch("/accountedit", {
                method: "POST",
                credentials: "same-origin",
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
