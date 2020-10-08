////
//// DO NOT DEPLOY
//// DO NOT DEPLOY
//// DO NOT DEPLOY
/// LOTS OF HTML INJECTION VULNERABILITIES!!






class BaseTable extends HTMLElement {
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

    get tableHeader() {
        return [this.tableHeaderFst, "Visitors", '%']
    }


    draw(entries) {

            var array = Object.entries(entries).sort((a, b) => (b[1] - a[1]))
            this.arrayTotal = array.map(a => a[1]).reduce((a, b) => a + b, 0)

            if (array.length === 0) {
                this.shadowRoot.innerHTML = NO_DATA_HTML
                return
            }

            // ESCAPE XXXXXXXXXXXXXXXXXXXXXXXXXXXX SECURITY  DO NOT DEPLOY - DO NOT DEPLOY - DO NOT DEPLOY
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

