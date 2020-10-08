
customElements.define(tagName(),
        class extends BaseTable {
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
