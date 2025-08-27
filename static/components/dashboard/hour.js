customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(hour) {
            const allHours = {
                ...Object.fromEntries([...Array(24).keys()].map((i) => [i, 0])),
                ...hour,
            };
            //let hourSum = Object.values(hour).reduce((acc, next) => acc + next, 0)
            const allHoursEntries = Object.entries(allHours);
            this.innerHTML = `
              <div class="metrics-three-data-content caption" data-simplebar data-simplebar-auto-hide="false">
                ${allHoursEntries
                    .map(
                        ([hour, count]) => `
                <div class="hour-item">
                  ${hour.padStart(2, '0')}:00
                  <dashboard-number class="caption-strong">${count}</dashboard-number>
                </div>`,
                    )
                    .join("")}
              </div>
              <div class="metrics-three-data-footer bg-white"></div>`;
        }
    },
);
