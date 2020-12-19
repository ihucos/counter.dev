customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(hour) {
            console.log(hour)
            let allHours = {
                ...Object.fromEntries([...Array(24).keys()].map(i => [i, 0])),
                ...hour,
            }
            console.log(allHours)
            this.innerHTML = `
              <div class="metrics-three-data-content caption" data-simplebar data-simplebar-auto-hide="false">
                ${Object.entries(allHours).map(entry => `
                <div class="hour-item">
                  ${('0' + (parseInt(entry[0])+1)).slice(-2)}:00
                  <span class="caption-strong">${entry[1]}</span>
                </div>`
                ).join('')}
              </div>
              <div class="metrics-three-data-footer bg-white"></div>`
        }
    }
);