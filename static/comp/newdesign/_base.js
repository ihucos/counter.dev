class Counter extends HTMLElement {
    topLevelDomainRe = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i
    draw(allVisits, curtime) {
        let count = this.count(allVisits[curtime])
        this.innerHTML = `
        <div class="category">
          <div class="h2 blue">${count}</div>
          <div class="category-label">
            ${escapeHtml(this.getAttribute('title'))}
            <div class="dynamics positive caption"><span class="dynamics-mobile">90%</span></div>
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
