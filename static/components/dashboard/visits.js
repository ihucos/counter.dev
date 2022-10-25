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
                  <span class="visits-time caption-strong">${
                      logEntry.time
                  }</span>
                  <img class="visits-ip" title="${
                      logEntry.country
                  }" src="/img/famfamfam_flags/gif/${
                          logEntry.country
                      }.gif" width="16" height="11" alt="${logEntry.country}">
                  <img class="visits-device" title="${
                      logEntry.device
                  }" src="/img/visits/devices/${(logEntry.device || '').toLowerCase()}.svg"></img>
                  <img class="visits-platform" title="${
                      logEntry.platform
                  }" src="/img/visits/platforms/${logEntry.platform.toLowerCase()}.svg"></img>
                  <span class="visits-referrer">${logEntry.referrerHtml}</span>
                </div>`
                  )
                  .join("")}

            </div>
            <div class="metrics-three-data-footer bg-white"></div>
          </div>
        </div>`;
        }

        parseLogEntry(visit) {
            var match = visit.split(" ");
            var logDate = match[0].slice(1);
            var logTime = match[1].slice(0, -4);
            var logCountry = match[2].toLowerCase();
            var logReferrer = match[3];
            var logDevice = match[4];
            var platform = match[5];

            if (logCountry === "") {
                logCountry = "xx";
            }

            if (logReferrer === "") {
                logReferrer = "-";
            } else {
                try {
                    var url = new URL(logReferrer);
                } catch (err) {
                    var url = null;
                }
                if (url === null) {
                    logReferrer = "?";
                } else {
                    logReferrer = `<a target="_blank" class="visits-referrer black" href="${escapeHtml(
                        logReferrer
                    )}">${url.host}</a>`;
                }
            }
            return {
                date: logDate,
                time: logTime,
                country: logCountry,
                referrerHtml: logReferrer,
                device: logDevice,
                platform: platform || "Unknown",
            };
        }
    }
);
