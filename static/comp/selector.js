

customElements.define(tagName(), 
    class extends HTMLElement {
        draw(sites){

                this.innerHTML = `<form action="" class="flex" style="margin-left: auto;">
                   <select id="site-selector" onchange="onSiteChanged()" class="selector float-right shadow text-gray-800 bg-gray-400 text-sm font-bold py-2 pr-8 rounded inline-flex items-center appearance-none mr-1" name="time-range" style="color: rgba(0,0,0, 0.7); padding-left: 12px;">
                      <option value="counter.dev">counter.dev</option>
                      <option selected="selected" value="simple-web-analytics.com">simple-web-analytics.com</option>
                   </select>
                </form>
                
                <form action="" class="flex" style="margin-left: 5px;">
                     <select id="time-range" onchange="onTimeRangeChanged()" class="selector float-right shadow text-gray-800 bg-gray-400 text-sm font-bold py-2 pr-8 rounded inline-flex items-center appearance-none mr-1" name="time-range" style="color: rgba(0,0,0, 0.7); padding-left: 12px;">
                        <option value="day">Today</option>
                        <option value="month">This Month</option>
                        <option value="year">This year</option>
                        <option value="all">All</option>

                     </select>
                  </form>`
        }

        setSelectedRange(range){
        }
        setSelectedSite(range){
        }
})

