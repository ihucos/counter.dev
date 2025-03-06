class Counter extends HTMLElement {
    topLevelDomainRe =
        /(?:www\.){0,1}([-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$)/i;

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
        let count = this.count(allVisits[curTime]);
        let nextCurTime = this.nextTime[curTime];
        let nextCount = this.count(allVisits[nextCurTime]);

        let datesPassedCurTime = Object.keys(
            dFillDatesToNow(allVisits[curTime].date, utcoffset),
            utcoffset
        ).length;
        let datesPassedNextTime = Object.keys(
            dFillDatesToNow(allVisits[nextCurTime].date, utcoffset)
        ).length;

        // hotfix: yesteday is special because it is a point in time and not time range
        // starting from now
        if (curTime == "yesterday") {
            datesPassedCurTime = 1;
        }
        if (nextCurTime == "yesterday") {
            datesPassedNextTime = 1;
        }

        let perThisTimeRange = count / datesPassedCurTime;
        let perNextTimeRange = nextCount / datesPassedNextTime;
        let percent = Math.round(
            (perThisTimeRange / perNextTimeRange - 1) * 100
        );

        let trend;
        let percentRepr;
        if (percent < 0) {
            trend = "negative";
            percentRepr = `${Math.abs(percent)}%`;
        } else if (!isFinite(percent) && count !== 0) {
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
        return Object.entries(visits.ref).reduce(
            (acc, next) => acc + (this.isMatch(next[0]) ? next[1] : 0),
            0
        );
    }

    isMatch(ref) {
        let match = this.topLevelDomainRe.exec(ref);
        if (match === null) {
            return null;
        }
        return this.countList.has(match[1]);
    }
}
