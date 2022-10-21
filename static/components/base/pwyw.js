customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML += `
               <section>
                 <div class="content">
                   <div class="donate-wrap">
                     <div class="donate-icon"></div>
                     <div class="donate-description">
                       <div class="h3 mb8">Pay what you want</div>
                       <div class="gray">
                         Our main goal is to provide the smoothest Web Analytics experience
                         possible.
                         <br />
                         Therefore we do not enforce payments but politely ask for an
                         affordable service fee.
                       </div>
                     </div>
                     <a
                       id="pay-now"
                       href="#modal-pwyw"
                       class="btn-primary"
                       rel="modal:open"
                       style="display: none;"
                     >
                       Pay now
                     </a>
                     <a
                       id="login-to-pay"
                       href="/welcome.html"
                       class="btn-primary"
                       style="display: none;"
                     >
                       Login to pay
                     </a>
                   </div>
                 </div>
               </section>

               <div id="modal-pwyw" style="display: none">
				   <div class="modal-header">
					  <img src="/img/card.svg" width="24" height="24" alt="Sources" />
					  <h3 class="ml16">Pay what you want</h3>
					  <a href="#" class="btn-close" rel="modal:close" style="visibility: visible;"></a>
				   </div>
				   <div class="modal-content">
                      <div>
                        Thanks for using counter for free. Consider
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
					  </section>
                      <div class="paypal-btn-wrapper mt24">
                          <a href="#" class="btn-secondary width-full" rel="modal:close" style="margin-bottom: 14px;">
                      I don't want to pay.
                          </a>
                      </div>
                  </div>
              </div>`;

            this.setupPayPalButton(2)
            this.setupPayPalButton(3)
            this.setupPayPalButton(5)
            this.setupPayPalButton(7)
            this.setupPayPalButton(10)
            this.setupPayPalButton(20)
            this.setupPayPalButton(30)


            let val = $("input[type=radio][name=plan]:checked").val()
            $("#paypal-btn-" + val).css('display', 'block')

            $("input[type=radio][name=plan]").change(function() {
                $(".paypal-btn").hide()
                $("#paypal-btn-" + this.value).css('display', 'block')
            })

            window.setInterval(function(){
                let height = $("#modal-pwyw").height()
                $("#modal-pwyw").css('min-height', height + 'px')
            }, 700);

            this.listenForUser()
        }

        setupPayPalButton(qty){
            $(".paypal-btn-wrapper").append(`
                    <div id="paypal-btn-${qty}" class="paypal-btn" style="margin: 0px auto;"></div>
                `)

            paypal.Buttons({
                style: {
                    shape: 'rect',
                    layout: 'vertical',
                    label: 'pay',
                    tagline: false,
                    color: 'blue'
                },
                createSubscription: function(data, actions) {
                    return actions.subscription.create({
                        /* Creates the subscription */
                        plan_id: 'P-60A66997B2622122KMNGEKNY',
                        custom_id: 'dummytest',
                        quantity: qty // The quantity of the product for a subscription
                    });
                },
                onApprove: function(data, actions) {
                    handleSubscriptionID(data.subscriptionID); // You can add optional success message for the subscriber here
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

        handleSubscriptionID(id){
            $.post("/subscribed", { subscription_id: id},
            )

        }

        hasUser(){
                document.querySelector("#login-to-pay").style.display = "none"
                document.querySelector("#pay-now").style.display = "inline-block"
        }


        noUser(){
                document.querySelector("#login-to-pay").style.display = "inline-block"
                document.querySelector("#pay-now").style.display = "none"
        }

        listenForUser(){
			switch(document.querySelector('base-navbar').status) {
			  case 'nouser':
                this.noUser()
				break;
			  case 'hasuser':
                this.hasUser()
			};
            document.addEventListener("userloaded", (evt) => {
                this.hasUser()
            })
            document.addEventListener("push-navbar-nouser", (evt) => {
                this.noUser()
            })
        }

    }
);
