class Counter extends HTMLElement {
    topLevelDomainRe = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i

    nextTime = {
        'day': 'month',
        'month': 'year',
        'year': 'all',
        'all': 'all',
    }

    draw(allVisits, curtime) {
        let count = this.count(allVisits[curtime])
        let nextCount = this.count(allVisits[this.nextTime[curtime]])

        let datesPassedCurTime = Object.keys(dPadDates(
            allVisits[curtime].date
        )).length
        let datesPassedNextTime = Object.keys(dPadDates(
            allVisits[this.nextTime[curtime]].date
        )).length
        console.log(datesPassedCurTime, datesPassedNextTime)

        let perThisTimeRange = count / datesPassedCurTime
        let perNextTimeRange = nextCount / datesPassedNextTime

        //let percent = perThisTimeRange + ' ' + perNextTimeRange
        let percent = Math.round(((perThisTimeRange / perNextTimeRange) - 1) * 100)
        //let percent = (Math.round(count/nextCount * 100))

        let trend
        let percentRepr
        if (percent < 0) {
            trend = 'negative'
            percentRepr = `${Math.abs(percent)}%`
        } else if (percent > 0) {
            trend = 'positive'
            percentRepr = `${percent}%`
        } else {
            trend = 'stability'
            percentRepr = ''
        }

        this.innerHTML = `
        <div class="category">
          <div class="h2 blue">${count}</div>
          <div class="category-label">
            ${escapeHtml(this.getAttribute('title'))}
            <div class="dynamics ${trend} caption"><span class="dynamics-mobile">${percentRepr}</span></div>
          </div>
        </div>`
    }

    count(visits) {
        return Object.entries(visits.ref).reduce(
            (acc, next) =>
            acc + (this.isMatch(next[0]) ? next[1] : 0),
            0)
    }

    isMatch(ref) {
        let match = this.topLevelDomainRe.exec(ref)
        if (match === null) {
            return null
        }
        return this.countList.has(match[0])
    }
}
