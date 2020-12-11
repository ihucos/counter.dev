customElements.define(
  tagName(),
  class extends HTMLElement {
    draw(sites, sitePref, rangePref) {
      this.style.display = "flex";
      this.style["margin-left"] = "5px";

      this.innerHTML = `
        <div class="project mr16">
          <img src="img-delete/bell.png" width="16" height="16" alt="Favicon" id="selector-favicon">
          <select onchange="onSiteChanged()" id="site-select">
            ${sites
              .map(
                (site) =>
                  `<option ${
                    sitePref === site ? "selected=selected" : ""
                  }value="${escapeHtml(site)}">${escapeHtml(site)}</option>`)
            .join("")}
          </select>
        </div>
        <select onchange="onTimeRangeChanged()" id="range-select">
          <option ${
            rangePref === "day" ? "selected=selected" : ""
          } value="day">Today</option>
          <option ${
            rangePref === "month" ? "selected=selected" : ""
          } value="month">This Month</option>
          <option ${
            rangePref === "year" ? "selected=selected" : ""
          } value="year">This year</option>
          <option ${
            rangePref === "all" ? "selected=selected" : ""
          } value="all">All</option>
        </select>`;

      let siteSelectEl = document.getElementById("site-select")
      siteSelectEl.onchange = (evt) => {
	this.setFavicon(evt.target.value)
        this.dispatchEvent(new Event("site-changed"));
      };
      this.setFavicon(siteSelectEl.value)
      document.getElementById("range-select").onchange = () => {
        this.dispatchEvent(new Event("range-changed"));
      };
      this.drawCalled = true
    }

    setFavicon(domain){
        let favicon = document.getElementById("selector-favicon")
        favicon.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`
    }

    get site() {
      return this.drawCalled && document.getElementById("site-select").value;
    }

    get range() {
      return this.drawCalled &&  document.getElementById("range-select").value;
    }
  }
);
