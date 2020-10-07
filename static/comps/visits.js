customElements.define('counter-visits',
    class extends HTMLElement {

        constructor() {
            super()
            this.attachShadow({
                mode: "open"
            });
            this.shadowRoot.innerHTML = "No data provided"
        }

        set entries(entries) {
            var visits = Object
                .entries(entries)
                .sort((a, b) => (b[1] - a[1]))
                .map(i => i[0]);
            this.shadowRoot.innerHTML = `
                     <table>
                        <tr>
                           <th>Date</th>
                           <th>Time</th>
                           <th>IP</th>
                           <th>Referrer</th>
                           <th>User-Agent</th>
                        </tr>

                       ${visits.map(visit => `
                       <tr>
                           ${this.visitRow(visit).map(val => `<td>${val}</td>`).join('')}
                       </tr>
                       `).join('')}
                     </table>`
        }

        visitRow(visit) {
            var match = (/\[(.*?) (.*?):..\] (.*?) (.*?) (.*)/g).exec(visit)
            if (match === null) {
                return []
            }
            var logDate = match[1]
            var logTime = match[2]
            var logCountry = match[3].toLowerCase()
            var logReferrer = match[4]
            var logUserAgent = match[5]

            // UGLY HACK, remove in a couple of months or so: June 2020
            if (logReferrer === 'Mozilla/5.0') {
                logReferrer = ''
                logUserAgent = `Mozilla/5.0 ${logUserAgent}`
            }

            if (logCountry === '' || logCountry === 'xx') {
                logCountry = '-'
            } else {
                logCountry = `<img title="${logCountry}" src="/famfamfam_flags/gif/${logCountry}.gif"></img>`
            }

            if (logReferrer === '') {
                logReferrer = '-'
            } else {
                try {
                    var url = new URL(logReferrer)
                } catch (err) {
                    var url = null
                }
                if (url === null) {
                    logReferrer = '?'
                } else {
                    logReferrer = `<a target="_blank" href="${logReferrer}">${url.host}</a>`
                }
            }
            return [logDate, logTime, logCountry, logReferrer, logUserAgent]
        }

    })
