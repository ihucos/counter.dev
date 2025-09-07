class Counter extends HTMLElement {
    topLevelDomainRe = /(?:www\.){0,1}([-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$)/i;

    nextTime = {
        day: "yesterday",
        yesterday: "last7",
        last7: "last30",
        last30: "all",
        month: "year",
        year: "all",
        all: "all",
        daterange: "all",
    };

    draw(allVisits, curTime, utcoffset) {
        const count = this.count(allVisits[curTime]);
        const nextCurTime = this.nextTime[curTime];
        const nextCount = this.count(allVisits[nextCurTime]);

        // Helper function to determine if a time range is a single point vs. a range
        const getDateCount = (timeRange, visits) => {
            if (timeRange === "yesterday") {
                return 1; // Single day
            }
            if (timeRange === "day") {
                return 1; // Single day
            }
            if (timeRange === "month" || timeRange === "year") {
                return 1; // Single point in time
            }
            // For ranges (last7, last30, all, daterange), calculate actual days
            return Object.keys(dFillDatesToNow(visits.date, utcoffset)).length;
        };

        const datesPassedCurTime = getDateCount(curTime, allVisits[curTime]);
        const datesPassedNextTime = getDateCount(nextCurTime, allVisits[nextCurTime]);

        const perThisTimeRange = count / datesPassedCurTime;
        const perNextTimeRange = nextCount / datesPassedNextTime;
        const percent = Math.round((perThisTimeRange / perNextTimeRange - 1) * 100);

        let trend;
        let percentRepr;
        if (percent < 0) {
            trend = "negative";
            percentRepr = `${Math.abs(percent)}%`;
        } else if (!Number.isFinite(percent) && count !== 0) {
            trend = "positive";
            percentRepr = "&infin;";
        } else if (percent > 0) {
            trend = "positive";
            percentRepr = `${percent}%`;
        } else {
            trend = "stability";
            percentRepr = "";
        }

        this.classList.add("category");
        this.innerHTML = `
          <dashboard-number class="h2 blue">${count}</dashboard-number>
          <div class="category-label">
            ${escapeHtml(this.getAttribute("text"))}
            <div
              class="dynamics ${trend} caption"
              title='Compares ${curTime} (${count}) with ${nextCurTime} (${nextCount})'
              ${curTime === nextCurTime ? `style="display: none;"` : ``}
            >
              <span class="dynamics-mobile">${percentRepr}</span>
            </div>
          </div>`;
    }

    count(visits) {
        return Object.entries(visits.ref).reduce((acc, next) => acc + (this.isMatch(next[0]) ? next[1] : 0), 0);
    }

    isMatch(ref) {
        const match = this.topLevelDomainRe.exec(ref);
        if (match === null) {
            return null;
        }
        return this.countList.has(match[1]);
    }
}
