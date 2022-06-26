customElements.define(
    tagName(),
    class extends HTMLElement {
        constructor() {
            super();
            this.last_sites = null;
        }

        draw(dump) {
            // we need the whole drump because we resend it via the redraw event to
            // all other components
            this.dump = dump;

            var sites = Object.entries(dump.sites)
                .sort((a, b) => b[1].count - a[1].count)
                .map((i) => i[0]);

            // We don't redraw if nothing changed for this component because
            // redrawing closes the dropdown for the user.
            if (JSON.stringify(this.last_sites) === JSON.stringify(sites)) {
                return;
            }
            this.last_sites = sites;

            if (dump.meta.demo) {
                sites = ["counter.dev"];
            }

            var sitePref = dump.user.prefs.site;
            var rangePref = dump.user.prefs.range;

            this.style.display = "flex";

            this.innerHTML = `
        <div class="project mr16">
          <img width="16" height="16" alt="Favicon" id="selector-favicon">
          <select onchange="onSiteChanged()" id="site-select">
            ${sites
                .map(
                    (site) =>
                        `<option ${
                            sitePref === site ? "selected=selected" : ""
                        }value="${escapeHtml(site)}">${escapeHtml(
                            site
                        )}</option>`
                )
                .join("")}
          </select>
        </div>
        <select onchange="onTimeRangeChanged()" id="range-select">
          <option ${
              rangePref === "day" ? "selected=selected" : ""
          } value="day">Today</option>
          <option ${
              rangePref === "yesterday" ? "selected=selected" : ""
          } value="yesterday">Yesterday</option>
          <option ${
              rangePref === "week" ? "selected=selected" : ""
          } value="week">This week</option>
          <option ${
              rangePref === "month" ? "selected=selected" : ""
          } value="month">This month</option>
          <option ${
              rangePref === "year" ? "selected=selected" : ""
          } value="year">This year</option>
          <option ${
              rangePref === "all" ? "selected=selected" : ""
          } value="all">All</option>
        </select>`;

            this.updateFavicon();

            document.getElementById("site-select").onchange = (evt) =>
                this.onSiteSelChanged(evt);
            document.getElementById("range-select").onchange = (evt) =>
                this.onRangeSelChanged(evt);
        }

        updateFavicon() {
            let favicon = document.getElementById("selector-favicon");
            favicon.src = `https://icons.duckduckgo.com/ip3/${this.site}.ico`;
        }

        onSiteSelChanged(evt) {
            this.updateFavicon();

            // request change up in the cloud and then also apply that change down
            // here in the client
            fetch(API_SERVER + "/setPrefSite?" + encodeURIComponent(this.site));
            this.dump.user.prefs.site = this.site;

            document.dispatchEvent(
                new CustomEvent("redraw", {
                    detail: this.dump,
                })
            );
        }

        onRangeSelChanged(evt) {
            // request change up in the cloud and then also apply that change down
            // here in the client
            fetch(API_SERVER + "/setPrefRange?" + encodeURIComponent(this.range));
            this.dump.user.prefs.range = this.range;

            document.dispatchEvent(
                new CustomEvent("redraw", {
                    detail: this.dump,
                })
            );
        }

        get site() {
            return (
                this.innerHTML !== "" &&
                document.getElementById("site-select").value
            );
        }

        get range() {
            return (
                this.innerHTML !== "" &&
                document.getElementById("range-select").value
            );
        }
    }
);
