customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(oldestArchiveDate){
            this.style.display = 'none'
            this.innerHTML = `
                  <div class="modal-header">
                    <img
                      src="/img/calendar.svg"
                      width="24"
                      height="24"
                      alt="Edit account"
                    />
                    <h3 class="ml16">Custom date range...</h3>
                    <a href="#" class="btn-close" rel="modal:close"></a>
                  </div>
                  <div class="modal-content" style="text-align: center;">
                    <form action="/query" method="GET">
                      <div>
                          <input type="text" name="from" class="width-full" style="display: none"/>
                          <input type="text" name="to" class="width-full" style="display: none" />
                      </div>

                      <div class="account-btn-group flex mb32">
                        <a href="#" class="btn-secondary full mr16" rel="modal:close">
                          Cancel
                        </a>
                        <button type="submit" class="btn-primary full">Select</button>
                      </div>

                    </form>
                  </div>`



            this.fromInputEl = this.querySelector('input[name="from"]')
            this.toInputEl = this.querySelector('input[name="to"]')

            let today = moment().format("YYYY-MM-DD");
            this.fromInputEl.setAttribute('max', today)
            this.fromInputEl.setAttribute('min', "2022-09-20")
            //this.fromInputEl.setAttribute('value', today) // debug
            this.toInputEl.setAttribute('max', today)
            this.toInputEl.setAttribute('min', "2022-09-20")
            //this.toInputEl.setAttribute('value', today)


            this.picker = new easepick.create({
                element: this.querySelector('input[name="from"]'),
                css: [
                    'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.0/dist/index.css',
                    'https://cdn.jsdelivr.net/npm/@easepick/lock_plugin@1.2.0/dist/index.css',
                    '/css/daterangepicker.css',
                ],
                plugins: ["RangePlugin", "AmpPlugin", "LockPlugin"],
				RangePlugin: {
                    elementEnd: this.querySelector('input[name="to"]'),
                    tooltip: true
                },
                AmpPlugin: {
                },
                LockPlugin: {
                    minDate: oldestArchiveDate,
                    maxDate: new Date()
                },
                inline: true,
                //calendars: 2,
                //grid: 2

            });

            this.picker.on('select', ()=>{alert('heeh')})


            simpleForm(this.querySelector('form'), (resp) => {
                let data = JSON.parse(resp)
                let from = moment(this.fromInputEl.value)
                let to = moment(this.toInputEl.value)
                if (from.isAfter(to)) {
                    [from, to] = [to, from]
                }
                let detail = {resp: data, to: to, from: from}
                document.dispatchEvent(new CustomEvent("selector-daterange-fetched", { detail: detail }));
                $.modal.close();
            })


            document.addEventListener("selector-daterange-fetch", (evt) => {
                this.picker.clear()
                this.popup()
            });

            $(()=>{
                $(this).on($.modal.AFTER_CLOSE, (event, modal) => {
                    if (window.state.myrange){
                        $('#range-select').val(window.state.myrange)
                        delete window.state.myrange

                    }
                });
            })


        }

        popup(){
            $(this).modal();
        }

        //get from(){
        //    return this.fromInputEl.value
        //}
        //set from(val){
        //    return this.fromInputEl.value = val
        //}

        //get to(){
        //    return this.toInputEl.value
        //}
        //set to(val){
        //    return this.toInputEl.value = val
        //}
})
