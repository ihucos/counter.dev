customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback(){
            if (!this.alreadyConnected){
                this.alreadyConnected = true
            } else {
                return
            }
            this.style.display = 'none'
            this.innerHTML = `
                  <div class="modal-header">
                    <img
                      src="/img/calendar.svg"
                      width="24"
                      height="24"
                      alt="Edit account"
                    />
                    <h3 class="ml16">Select range</h3>
                    <a href="#" class="btn-close" rel="modal:close"></a>
                  </div>
                  <div class="modal-content" style="text-align: center; height: 400px;">
                    <form action="/query" method="GET">
                      <input type="text" name="from" class="width-full" style="display: none"/>
                      <input type="text" name="to" class="width-full" style="display: none" />

                    </form>
                  </div>`



            this.fromInputEl = this.querySelector('input[name="from"]')
            this.toInputEl = this.querySelector('input[name="to"]')

            let today = moment().format("YYYY-MM-DD");
            this.fromInputEl.setAttribute('max', today)
            this.fromInputEl.setAttribute('min', "2022-09-20")
            this.fromInputEl.setAttribute('value', today) // debug
            this.toInputEl.setAttribute('max', today)
            this.toInputEl.setAttribute('min', "2022-09-20")
            this.toInputEl.setAttribute('value', today)


            const picker = new easepick.create({
                element: this.querySelector('input[name="from"]'),
                css: [
                    'https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.0/dist/index.css',
                    'https://cdn.jsdelivr.net/npm/@easepick/lock_plugin@1.2.0/dist/index.css',
                    '/css/daterangepicker.css',
                ],
                plugins: ["RangePlugin", "AmpPlugin", "LockPlugin"],
				RangePlugin: {
                    elementEnd: this.querySelector('input[name="to"]')
                },
                AmpPlugin: {
                    dropdown: {
                        months: true,
                        years: true,
                        minYear: 2022
                    }
                },
                LockPlugin: {
                    minDate: "2022-09-20",
                    maxDate: new Date()
                },

                inline: true,

            });


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
