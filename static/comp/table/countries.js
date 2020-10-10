
customElements.define(tagName(),
        class extends BaseTable {
            tableHeaderFst = "Country"
             tableRow(key, value) {
                 return [this.decorateCountry(key), value, this.percentRepr(value)]
             }
             decorateCountry(code){
                 return `
                     <img src="/famfamfam_flags/gif/${code}.gif">
                     ${this.resolveCountry(code)}</img>`
             }
             resolveCountry(code) {
                 // hidden jqvmap dependency
                 var entry = JQVMap.maps["world_en"].paths[code]
                 if (code === "us") {
                     return "USA"
                 }
                 if (entry) {
                     return entry["name"]
                 } else {
                     return "Unknown"
                 }
             }
        }
)
