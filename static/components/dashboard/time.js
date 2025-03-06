customElements.define(
    tagName(),
    class extends HTMLElement {
        sumHours(entries, arr) {
            var sum = 0;
            arr.forEach((el) => (sum += entries[el] || 0));
            return sum;
        }

        draw(hour) {
            let dayparts = [
                this.sumHours(hour, [5, 6, 7, 8, 9, 10, 11]),
                this.sumHours(hour, [12, 13, 14, 15]),
                this.sumHours(hour, [16, 17, 18, 19, 20, 21]),
                this.sumHours(hour, [22, 23, 24, 0, 1, 2, 3, 4]),
            ];

            this.innerHTML = `
                <div class="metrics-three-data-content-day" id="day">
                  <dashboard-time-graph
                    class="metrics-three-graph-wrap"
                  ></dashboard-time-graph>
                  <div class="caption mt24">
                    <span class="graph-dot mb8">
                      <span class="graph-dot-ellipse bg-dark-blue mr8"></span>
                      Morning
                      <dashboard-number class="caption-strong">${dayparts[0]}</dashboard-number>
                    </span>
                    <span class="graph-dot mb8">
                      <span class="graph-dot-ellipse bg-red mr8"></span>
                      Afternoon
                      <dashboard-number class="caption-strong">${dayparts[1]}</dashboard-number>
                    </span>
                    <span class="graph-dot mb8">
                      <span class="graph-dot-ellipse bg-green mr8"></span>
                      Evening
                      <dashboard-number class="caption-strong">${dayparts[2]}</dashboard-number>
                    </span>
                    <span class="graph-dot">
                      <span class="graph-dot-ellipse bg-yellow mr8"></span>
                      Night
                      <dashboard-number class="caption-strong">${dayparts[3]}</dashboard-number>
                    </span>
                  </div>
                </div>`;
            this.getElementsByTagName("dashboard-time-graph")[0].draw(dayparts);
        }
    }
);
