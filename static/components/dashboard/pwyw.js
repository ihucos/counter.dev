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
				   <div class="modal-content">




                      <div>
                        Thanks for using counter. Consider
                        paying a service fee. Your contribution will be used to cover
                        development and maintenance. <a href="mailto:hey@counter.dev">Contact us</a> for anything.
                      </div>


					  <section class="mt8 mb16 plans">
						 <div>
							<input type="radio" name="plan" value="2m" />
                            <label>2&euro; per month</label>
						 </div>
						 <div class="highlight">
							<input type="radio" name="plan" value="3m" />
                            <label>3&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="5m" checked=checked />
                            <label>5&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="7m" />
                            <label>7&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="20m" />
                            <label>20&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="30m" />
                            <label>30&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="50m" />
                            <label>50&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="0" />
                            <label>Don't pay</label>
						 </div>
					  </section>





                <div class="paypal-btn-wrapper mt24 mb32">
				</div>`;

            this.setupPayPalButton("2m")
            this.setupPayPalButton("3m")
            this.setupPayPalButton("5m")
            this.setupPayPalButton("7m")
            this.setupPayPalButton("10m")
            this.setupPayPalButton("20m")
            this.setupPayPalButton("30m")
            this.setupPayPalButton("50m")


            let val = $("input[type=radio][name=plan]:checked").val()
            $("#paypal-btn-" + val).show()

            $("input[type=radio][name=plan]").change(function() {
                $(".paypal-btn").hide()
                $("#paypal-btn-" + this.value).show()
            })


        }

        setupPayPalButton(id){
            $(".paypal-btn-wrapper").append(`
                    <div id="paypal-btn-${id}" class="paypal-btn mt16" style="margin: 0px auto;"></div>
                `)
            paypal.Buttons({
                style: {
                    shape: 'rect',
                    layout: 'horizontal',
                    label: 'pay',
                    tagline: false,
                    color: 'blue'
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
            }).render(`#paypal-btn-${id}`); // Renders the PayPal button

        }
    }
);
