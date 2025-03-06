customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(hour) {
            let allHours = {
                ...Object.fromEntries([...Array(24).keys()].map((i) => [i, 0])),
                ...hour,
            };
            //let hourSum = Object.values(hour).reduce((acc, next) => acc + next, 0)
            let allHoursEntries = Object.entries(allHours);
            this.innerHTML = `
              <div class="metrics-three-data-content caption" data-simplebar data-simplebar-auto-hide="false">
                ${allHoursEntries
                    .map(
                        (entry) => `
                <div class="hour-item">
                  ${("0" + (parseInt(entry[0]) + 1)).slice(-2)}:00
                  <dashboard-number class="caption-strong">${
                      entry[1]
                  }</dashboard-number>
                </div>`
                    )
                    .join("")}
              </div>
              <div class="metrics-three-data-footer bg-white"></div>`;
        }
    }
);
