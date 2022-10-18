customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML += `
               <div id="modal-pwyw" style="display: none">
				   <div class="modal-header">
					  <img src="/img/card.svg" width="24" height="24" alt="Sources" />
					  <h3 class="ml16">Pay what you want</h3>
					  <a href="#" class="btn-close" rel="modal:close"></a>
				   </div>
				   <div class="modal-content" style="padding-top: 8px;">
					  <div class="caption " style="text-align: right;">
                         <a href="#" class="mr8 toggle-btn">More options</a>
                         /
						 <a href="#" class="ml8">don't pay</a>
					  </div>

					  <div class="mt32 mb24 radios">
						 <div class="toggle">
							<input type="radio" name="plan" value="50" />
                            <span>
                              50&euro; per month (Higher traffic)
							</span>
						 </div>
						 <div class="toggle">
							<input type="radio" name="plan" value="50" />
                            <span>
                              30&euro; per month (Higher traffic)
							</span>
						 </div>
						 <div class="toggle mb8">
							<input type="radio" name="plan" value="50" />
                            <span>
                              20&euro; per month (Higher traffic)
							</span>
						 </div>
						 <div>
							<input type="radio" name="plan" value="50" />
                            <span class="hilighted">
                              7&euro; per month
							</span>
						 </div>
						 <div>
							<input type="radio"  name="plan" value="50" checked=checked />
                            <span class="suggested">
							5&euro; per month
							</span>
						 </div>
						 <div>
							<input type="radio" name="plan" value="50" />
                            <span class="hilighted">
							  3&euro; per month
							</span>
						 </div>
						 <div class="mt8 toggle">
							<input type="radio" name="plan" value="50" />
                            <span class="little">
							  2&euro; per month
							</span>
						 </div>
						 <div class="toggle">
							<input type="radio" name="plan" value="50" />
                            <span class="little">
							  1&euro; per month
							</span>
						 </div>
					  </div>


                      <div>
                        Thanks for using counter for free. Whenever you are ready, start
            paying a service fee. Your contribution will be used to cover
            development and maintenance.
                      </div>

                <div class="account-btn-group mt24 mb32">
						 <div id="paypal-button-container" style="margin: 0px auto;"></div>
                         <div id="btns" class="account-btn-group flex mt24 mb32">
                              <a href="#" class="btn-secondary mr16 full " rel="modal:close">
                                  Maybe later
                              </a>
                              <button type="submit" class="btn-primary full">Pay now</button>
                         </div>

					  </div>
				   </div>
				</div>`;

            this.querySelector(".toggle-btn").onclick = ()=>{

                $(".toggle-btn").text(function(i, text){
                    return text === "More options" ? "Less options" : "More options";
                })

                $("#modal-pwyw .toggle").toggle("fast")
            }

            this.querySelector('button[type="submit"]').onclick = ()=>{
                paypal.Buttons({
                    style: {
                      shape: 'rect',
                      color: 'gold',
                      layout: 'horizontal',
                      label: 'pay'
                    },
                    createSubscription: function(data, actions) {
                    return actions.subscription.create({
                      /* Creates the subscription */
                      plan_id: 'P-60A66997B2622122KMNGEKNY',
                      quantity: 1 // The quantity of the product for a subscription
                    });
                    },
                    onApprove: function(data, actions) {
                    alert(data.subscriptionID); // You can add optional success message for the subscriber here
                    },
                    //onInit: function(data, actions) {
                    //      actions.disable();
                    //}
                }).render('#paypal-button-container'); // Renders the PayPal button
                $("#btns").hide()
                $("dashboard-pwyw input").attr("disabled", "disabled")
            }
        }
    }
);
