customElements.define(
    tagName(),
    class extends HTMLElement {
        constructor() {
            super();
            this.last_sites = null;
            document.addEventListener("selector-daterange-fetched", (evt) => {
                this.handleDateRangeFetched(evt.detail)
            });
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
              rangePref === "last7" ? "selected=selected" : ""
          } value="last7">Last 7 days</option>
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
          } value="all">All time</option>
        <option ${
            rangePref === "daterangeset" ? "selected=selected" : ""
        } value="daterangeset">Custom date range...</option>
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
            fetch("/setPrefSite?" + encodeURIComponent(this.site));
            this.dump.user.prefs.site = this.site;

            document.dispatchEvent(
                new CustomEvent("redraw", {
                    detail: this.dump,
                })
            );
        }

        onRangeSelChanged(evt) {
            if (this.range == "daterangeset") {
                document.dispatchEvent(new Event("selector-daterange-fetch"));
                return
            }

            // request change up in the cloud and then also apply that change down
            // here in the client
            fetch("/setPrefRange?" + encodeURIComponent(this.range));
            this.dump.user.prefs.range = this.range;
            window.state.myrange = this.range
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
            let r = (
                this.innerHTML !== "" &&
                document.getElementById("range-select").value
            );
            console.log(r)
            return r
        }

        handleDateRangeFetched(obj){
            let resp = obj.resp
            let from = obj.from
            let to = obj.to
            let tofrom = from.format('DD MMM') + ' - ' + to.format('DD MMM')
            let origArchiveTxt = $('#range-select option[value="daterangeset"]').text()
            $('#range-select option[value="daterange"]').remove()
            $('#range-select option[value="daterangeset"]').val("daterange").text(tofrom).after(
                $('<option/>').attr('value', "daterangeset").text(origArchiveTxt)
            )
            delete window.state.myrange


            for (const site of Object.keys(this.dump.sites)){
                let siteData = resp[site]
                if (siteData){
                    this.dump.sites[site].visits.daterange = siteData
                } else {
                    let nildata = Object.fromEntries(Object.keys(this.dump.sites[site].visits.all).map((k)=>[k, {}]))
                    this.dump.sites[site].visits.daterange = nildata
                }
            }

            document.dispatchEvent(
                new CustomEvent("redraw", {
                    detail: this.dump,
                })
            );
        }
    }
);
