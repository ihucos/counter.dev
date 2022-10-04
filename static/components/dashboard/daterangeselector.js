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
                  <div class="modal-content">
                    <form action="/query" method="GET">
                      <label class="width-full mb16">
                        From
                        <input type="date" name="from" class="width-full" />
                      </label>

                      <label class="width-full">
                        To
                        <input type="date" name="to" class="width-full" />
                      </label>

                      <div class="account-btn-group flex mt24 mb32">
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
            this.fromInputEl.setAttribute('value', today) // debug
            this.toInputEl.setAttribute('max', today)
            this.toInputEl.setAttribute('min', "2022-09-20")
            this.toInputEl.setAttribute('value', today)


            simpleForm(this.querySelector('form'), (resp) => {
                let data = JSON.parse(resp)
                document.dispatchEvent(new CustomEvent("selector-daterange-fetched", { detail: data }));
                let from = moment(this.fromInputEl.value)
                let to = moment(this.toInputEl.value)
                if (from.isAfter(to)) {
                    [from, to] = [to, from]
                }


                let tofrom = from.format('DD MMM') + ' - ' + to.format('DD MMM')
                let origArchiveTxt = $('#range-select option[value="daterange"]').text()
                $('#range-select option[value="daterangeSel"]').remove()
                $('#range-select option[value="daterange"]').val("daterangeSel").text(tofrom).before(
                    $('<option/>').attr('value', "daterange").text(origArchiveTxt)
                )
                delete window.state.myrange
                $.modal.close();
            })


            document.addEventListener("selector-daterange-clicked", (evt) => {
                $(this).modal();
                this.popup()
            });

            $(()=>{
                $('#modal-range').on($.modal.AFTER_CLOSE, (event, modal) => {
                    if (window.state.myrange){
                        $('#range-select').val(window.state.myrange)
                        delete window.state.myrange

                    }
                });
            })


        }

        popup(){
            $("#modal-range").modal();
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
