customElements.define(
  tagName(),
  class extends HTMLElement {
    draw(sites, sitePref, rangePref) {
      this.style.display = "flex";
      this.style["margin-left"] = "5px";

      // HTML INJECTION!!!!
      this.innerHTML = `<form action="" class="flex" style="margin-left: auto;">
                   <select onchange="onSiteChanged()" class="site-select selector float-right shadow text-gray-800 bg-gray-400 text-sm font-bold py-2 pr-8 rounded inline-flex items-center appearance-none mr-1" name="time-range" style="color: rgba(0,0,0, 0.7); padding-left: 12px;">
                      ${sites
                        .map(
                          (site) =>
                            `<option ${
                              sitePref === site ? "selected=selected" : ""
                            }value="${site}">${site}</option>`
                        )
                        .join("")}
                   </select>
                </form>
                
                <form action="" class="flex" style="margin-left: 5px;">
                     <select onchange="onTimeRangeChanged()" class="range-select selector float-right shadow text-gray-800 bg-gray-400 text-sm font-bold py-2 pr-8 rounded inline-flex items-center appearance-none mr-1" name="time-range" style="color: rgba(0,0,0, 0.7); padding-left: 12px;">
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

                     </select>
                  </form>`;
      document.getElementsByClassName("site-select")[0].onchange = () => {
        this.dispatchEvent(new Event("site-changed"));
      };
      document.getElementsByClassName("range-select")[0].onchange = () => {
        this.dispatchEvent(new Event("range-changed"));
      };
    }

    get site() {
      return document.getElementsByClassName("site-select")[0].value;
    }

    get range() {
      return document.getElementsByClassName("range-select")[0].value;
    }
  }
);
