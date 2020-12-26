customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(logs) {
            var entries = Object.entries(logs).sort((a, b) => b[1] - a[1]);
            var parsedLogs = entries.map((e) => this.parseLogEntry(e[0]));
            this.innerHTML = `
        <div class="metrics-four-item" id="visits">
          <div class="metrics-headline">
            <img src="img/visit.svg" width="24" height="24" alt="Visits">
            <h3 class="ml16">Visits</h3>
          </div>
          <div class="metrics-three-data bg-white radius-lg shadow-sm">
            <div class="metrics-three-data-headline shadow-sm caption gray">
              <span class="visits-date">Date</span>
              <span class="visits-time">Time</span>
              <span class="visits-ip">IP</span>
              <span class="visits-referrer">Referrer</span>
            </div>
            <div class="metrics-three-data-content caption" data-simplebar data-simplebar-auto-hide="false">
              ${parsedLogs
                  .map(
                      (logEntry) => `
                <div class="hour-item">
                  <span class="visits-date">${logEntry.date}</span>
                  <span class="visits-time caption-strong">${logEntry.time}</span>
                  <img src="/famfamfam_flags/gif/${logEntry.country}.gif" width="16" height="11" alt="${logEntry.country}">
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
            var match = /\[(.*?) (.*?):..\] (.*?) (.*?) (.*)/g.exec(visit);
            if (match === null) {
                return [];
            }
            var logDate = match[1];
            var logTime = match[2];
            var logCountry = match[3].toLowerCase();
            var logReferrer = match[4];
            var logUserAgent = match[5];

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
                userAgent: logUserAgent,
            };
        }
    }
);
