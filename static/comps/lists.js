class BaseList extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({
            mode: "open"
        });
        this.shadowRoot.innerHTML = "No data provided"
    }

    tableRow(key, value) {
        return [key, value, this.percentRepr(value)]
    }

    percentRepr(value) {
        var percentRepr = Math.round(value / this.arrayTotal * 100) + '%'
        if (percentRepr === '0%') {
            percentRepr = '<1%'
        }
        return percentRepr
    }

    get tableHeader() {return [this.tableHeaderFst, "Visitors", '%']}


    set entries(entries) {

            var array = Object.entries(entries).sort((a, b) => (b[1] - a[1]))
            this.arrayTotal = array.map(a => a[1]).reduce((a, b) => a + b)

            if (array.length === 0) {
                this.shadowRoot.innerHTML = NO_DATA_HTML
                return
            }

            // ESCAPE XXXXXXXXXXXXXXXXXXXXXXXXXXXX SECURITY 
            this.shadowRoot.innerHTML = `
                <table>
                  ${this.tableHeader ? this.tableHeader.map(val => `<th>${val}</th>`).join(''):''}
                  ${array.map(entr => `
                  <tr>
                      ${this.tableRow(...entr).map(val => `<td>${val}</td>`).join('')}
                  </tr>
                  `
                  ).join('')}
                <table>`

    }
}


customElements.define('list-languages',
        class extends BaseList {
            tableHeaderFst = "Language"
        }
)

customElements.define('list-screens',
        class extends BaseList {
            tableHeaderFst = "Screen"
        }
)

customElements.define('list-locations',
        class extends BaseList {
            tableHeaderFst = "Location"
        }
)


customElements.define('list-referrals',
        class extends BaseList {
             tableHeaderFst = "referral"
             tableRow(key, value) {
                 return [this.decorateReferrer(key), value, this.percentRepr(value)]
             }
             decorateReferrer(ref){
                 return `
                     <img src="https://icons.duckduckgo.com/ip3/${ref}.ico"></img>
                     <a href="${ref}">${ref}</a>`
             }
        }
)
