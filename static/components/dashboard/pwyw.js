customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML += `
               <div id="modal-pwyw" style="display: none">
				   <div class="modal-header">
					  <img src="/img/card.svg" width="24" height="24" alt="Sources" />
					  <h3 class="ml16">Pay what you want</h3>
					  <a href="#" class="btn-close" rel="modal:close" style="visibility: visible;"></a>
				   </div>
				   <div class="modal-content">




                      <div>
                        Thanks for using counter. Consider
                        paying a service fee. Your contribution will be used to cover
                        development and maintenance. <a href="mailto:hey@counter.dev">Contact us</a> for anything.
                      </div>


					  <section class="mt8 mb16 plans">
						 <div>
							<input type="radio" name="plan" value="2" />
                            <label>2&euro; per month</label>
						 </div>
						 <div class="highlight">
							<input type="radio" name="plan" value="3" />
                            <label>3&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="5" checked=checked />
                            <label>5&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="7" />
                            <label>7&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="20" />
                            <label>20&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="30" />
                            <label>30&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="50" />
                            <label>50&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="0" />
                            <label>Don't pay</label>
						 </div>
					  </section>





                <div class="paypal-btn-wrapper mt24 mb32">
                    <a href="#" id="paypal-btn-0" class="paypal-btn btn-secondary width-full" style="display: none" rel="modal:close">
                        Thanks, I don't want to pay.
                    </a>
				</div>`;

            this.setupPayPalButton(2)
            this.setupPayPalButton(3)
            this.setupPayPalButton(5)
            this.setupPayPalButton(7)
            this.setupPayPalButton(10)
            this.setupPayPalButton(20)
            this.setupPayPalButton(30)
            this.setupPayPalButton(50)


            let val = $("input[type=radio][name=plan]:checked").val()
            $("#paypal-btn-" + val).css('display', 'block')

            $("input[type=radio][name=plan]").change(function() {
                $(".paypal-btn").hide()
                $("#paypal-btn-" + this.value).css('display', 'block')
            })


        }

        setupPayPalButton(qty){
            $(".paypal-btn-wrapper").append(`
                    <div id="paypal-btn-${qty}" class="paypal-btn" style="margin: 0px auto;"></div>
                `)
            let color = 'blue'
            if (qty < 3) {
                color = 'white'
            }
            if (qty >= 20) {
                color = 'gold'
            }
            paypal.Buttons({
                style: {
                    shape: 'rect',
                    layout: 'horizontal',
                    label: 'pay',
                    tagline: false,
                    color: color
                },
                createSubscription: function(data, actions) {
                    return actions.subscription.create({
                        /* Creates the subscription */
                        plan_id: 'P-60A66997B2622122KMNGEKNY',
                        quantity: qty // The quantity of the product for a subscription
                    });
                },
                onApprove: function(data, actions) {
                    alert(data.subscriptionID); // You can add optional success message for the subscriber here
                },
            }).render(`#paypal-btn-${qty}`); // Renders the PayPal button

        }


        modal(){
            $('dashboard-pwyw > div').modal({
                escapeClose: false,
                clickClose: false,
                showClose: false
            });
        }

    }
);
