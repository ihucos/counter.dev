customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(logs) {
            var entries = Object.entries(logs).sort((a, b) => b[1] - a[1]);
            var parsedLogs = entries.map((e) => this.parseLogEntry(e[0]));
            parsedLogs = parsedLogs.filter((n) => n); // filter out null values (parse errors)
            this.innerHTML = `
        <div class="metrics-four-item">
          <div class="metrics-headline">
            <img src="/img/visit.svg" width="24" height="24" alt="Visits">
            <h3 class="ml16">Visits</h3>
          </div>
          <div class="metrics-three-data bg-white radius-lg shadow-sm">
            <div class="metrics-three-data-headline shadow-sm caption gray">
              <span class="visits-date">Date</span>
              <span class="visits-time">Time</span>
              <span class="visits-ip"></span>
              <span class="visits-device"></span>
              <span class="visits-platform"></span>
              <span class="visits-referrer">Referrer</span>
            </div>
            <div class="metrics-three-data-content caption" data-simplebar data-simplebar-auto-hide="false">
              ${parsedLogs
                  .map(
                      (logEntry) => `
                <div class="hour-item">
                  <span class="visits-date">${logEntry.date}</span>
                  <span class="visits-time caption-strong">${logEntry.time}</span>
                  <img class="visits-ip" title="${logEntry.country}" src="/img/famfamfam_flags/gif/${logEntry.countryCode}.gif" width="16" height="11" alt="${logEntry.country}">
                  <img class="visits-device" title="${logEntry.device}" src="/img/visits/devices/${logEntry.deviceSlug}.svg"></img>
                  <img class="visits-platform" title="${logEntry.platform}" src="/img/visits/platforms/${logEntry.platformSlug}.svg"></img>
                  <span class="visits-referrer">${logEntry.referrerHtml}</span>
                </div>`,
                  )
                  .join("")}

            </div>
            <div class="metrics-three-data-footer bg-white"></div>
          </div>
        </div>`;
        }

        parseLogEntry(visit) {
            if (!visit || typeof visit !== "string") return null;
            const match = visit.split(" ");
            if (match.length < 6) return null;

            const rawDate = String(match[0] || "");
            const rawTime = String(match[1] || "");
            const logDate = rawDate ? rawDate.slice(1) : "";
            const logTime = rawTime ? rawTime.slice(0, -4) : "";

            let logCountry = String(match[2] || "").toLowerCase();
            let logReferrer = String(match[3] || "");
            const logDevice = String(match[4] || "Unknown");
            const platform = String(match[5] || "Unknown");

            // sanitize for asset paths
            const slug = (s) => s.toLowerCase().replace(/[^a-z0-9_-]/g, "");
            const deviceSlug = slug(logDevice) || "unknown";
            const platformSlug = slug(platform) || "unknown";
            // normalize country code for flag assets
            const countryCode = /^[a-z]{2}$/.test(logCountry) ? logCountry : "xx";

            if (logCountry === "") {
                logCountry = "xx";
            }

            if (logReferrer === "") {
                logReferrer = "-";
            } else {
                let url;
                try {
                    url = new URL(logReferrer);
                } catch (_err) {
                    url = null;
                }
                if (!url || !/^https?:$/.test(url.protocol)) {
                    logReferrer = "?";
                } else {
                    logReferrer = `<a target="_blank" rel="noopener noreferrer nofollow" class="visits-referrer black" href="${escapeHtml(logReferrer)}">${escapeHtml(url.host)}</a>`;
                }
            }
            return {
                date: logDate,
                time: logTime,
                country: logCountry || "Unknown",
                countryCode,
                referrerHtml: logReferrer,
                device: logDevice,
                deviceSlug,
                platform: platform || "Unknown",
                platformSlug,
            };
        }
    },
);
