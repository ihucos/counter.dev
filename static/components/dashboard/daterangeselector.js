customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback(){
            this.innerHTML = `
                <div id="modal-range" style="display: none">
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
                  </div>
                </div>`


            simpleForm(this.querySelector('form'), (resp) => {
                let data = JSON.parse(resp)
                document.dispatchEvent(new CustomEvent("selector-archive-fetched", { detail: data }));
                let fromInp = $('#modal-range form input[name="from"]').val()
                let toInp = $('#modal-range form input[name="to"]').val()
                let from = moment(fromInp)
                let to = moment(toInp)
                if (from.isAfter(to)) {
                    [from, to] = [to, from]
                }


                let tofrom = from.format('DD MMM') + ' - ' + to.format('DD MMM')
                let origArchiveTxt = $('#range-select option[value="archive"]').text()
                $('#range-select option[value="archiveSel"]').remove()
                $('#range-select option[value="archive"]').val("archiveSel").text(tofrom).before(
                    $('<option/>').attr('value', "archive").text(origArchiveTxt)
                )
                delete window.state.myrange
                $.modal.close();
            })


            document.addEventListener("selector-archive-clicked", (evt) => {
                $("#modal-range").modal();
            });

            $(()=>{
                $('#modal-range').on($.modal.AFTER_CLOSE, (event, modal) => {
                    if (window.state.myrange){
                        $('#range-select').val(window.state.myrange)
                        delete window.state.myrange

                    }
                });
            })


            window.onload = () => {
                let today = moment().format("YYYY-MM-DD");
                $('#modal-range input[name="from"]')
                    .attr("max", today)
                    .attr("min", "2022-09-20")
                    .attr("value", moment().format("YYYY-MM-DD")); // debug
                $('#modal-range input[name="to"]')
                    .attr("max", today)
                    .attr("min", "2022-09-20")
                    .attr("value", moment().format("YYYY-MM-DD"));
            };




        }
})
