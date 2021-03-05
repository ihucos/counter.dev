class Counter extends HTMLElement {
    topLevelDomainRe = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i;

    nextTime = {
        day: "month",
        month: "year",
        year: "all",
        all: "all",
    };

    draw(allVisits, curTime, utcoffset) {
        let count = this.count(allVisits[curTime]);
        let nextCurTime = this.nextTime[curTime];
        let nextCount = this.count(allVisits[nextCurTime]);

        let datesPassedCurTime = Object.keys(
            dPadDates(allVisits[curTime].date, utcoffset),
            utcoffset
        ).length;
        let datesPassedNextTime = Object.keys(
            dPadDates(allVisits[nextCurTime].date, utcoffset)
        ).length;

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
        } else if (percent > 0) {
            trend = "positive";
            percentRepr = `${percent}%`;
        } else {
            trend = "stability";
            percentRepr = "";
        }

        this.classList.add("category");
        this.innerHTML = `
          <div class="h2 blue">${count}</div>
          <div class="category-label">
            ${escapeHtml(this.getAttribute("text"))}
            <div
              class="dynamics ${trend} caption"
              title='Compares this ${curTime} (${count}) with this ${nextCurTime} (${nextCount})'
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
        return this.countList.has(match[0]);
    }
}
