


customElements.define(tagName(), 
    class extends HTMLElement {
        connectedCallback(){
        	this.innerHTML = '<div class="nodata">No data</div>'
        }
})
