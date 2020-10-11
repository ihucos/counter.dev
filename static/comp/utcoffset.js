


customElements.define(tagName(), 
    class extends HTMLElement {
        constructor(){super()}
        connectedCallback(){
        	this.innerHTML = getUTCOffset()
        }
})
