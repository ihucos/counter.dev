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
               </section>`


            document.querySelector('base-navbar').loggedInUserCallback(
                (userDump)=>{
                    this.drawPlans(userDump)
                    this.showPayNowBtn();
                    this.highlightPersonalizedSuggestion(userDump)
                },
                ()=>this.showLoginToPayBtn(),

            )
        }

        drawPlans(userDump){


            this.innerHTML += `
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
						 <div class="highlightable">
							<input type="radio" name="plan" value="3" />
                            <label>3&euro; per month</label>
						 </div>
						 <div class="highlightable">
							<input type="radio" name="plan" value="5" />
                            <label>5&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="7" />
                            <label>7&euro; per month</label>
						 </div>
						 <div class="highlightable">
							<input type="radio" name="plan" value="20" />
                            <label>20&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="25" />
                            <label>25&euro; per month</label>
						 </div>
						 <div>
							<input type="radio" name="plan" value="30" />
                            <label>30&euro; per month</label>
						 </div>
					  </section>
                      <div class="paypal-btn-wrapper mt24">
                      </div>
                  </div>
              </div>`;

            this.setupPayPalButton(2, userDump.user.id)
            this.setupPayPalButton(3, userDump.user.id)
            this.setupPayPalButton(5, userDump.user.id)
            this.setupPayPalButton(7, userDump.user.id)
            this.setupPayPalButton(10, userDump.user.id)
            this.setupPayPalButton(20, userDump.user.id)
            this.setupPayPalButton(25, userDump.user.id)
            this.setupPayPalButton(30, userDump.user.id)

            $("input[type=radio][name=plan]").change(function() {
                $(".paypal-btn").hide()
                $("#paypal-btn-" + this.value).css('display', 'block')
            })

            // js hack for css stuff
            window.setInterval(function(){
                let height = $("#modal-pwyw").height()
                $("#modal-pwyw").css('min-height', height + 'px')
            }, 700);
        }

        setupPayPalButton(qty, username){
            $(".paypal-btn-wrapper").append(`
                    <div id="paypal-btn-${qty}" class="paypal-btn" style="margin: 0px auto; display: none"></div>
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
                        custom_id: username,
                        quantity: qty // The quantity of the product for a subscription
                    });
                },
                onApprove: function(data, actions) {
                    subscriptionSuccess(data.subscriptionID);
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

        subscriptionSuccess(subscriptionID){
            $.post("/subscribed", { subscription_id: subscriptionID})
            alert("You are awesome. That's all there is to say.")
            $.modal.close()
        }

        showPayNowBtn(){
            document.querySelector("#login-to-pay").style.display = "none"
            document.querySelector("#pay-now").style.display = "inline-block"
        }


        showLoginToPayBtn(){
            document.querySelector("#login-to-pay").style.display = "inline-block"
            document.querySelector("#pay-now").style.display = "none"
        }

        highlightPersonalizedSuggestion(dump){
            var FIVE_EUROS_SUGGESTION = 0
            var SEVEN_EUROS_SUGGESTION = 1
            var TWENTYFIVE_EUROS_SUGGESTION = 2

            var allHitsPerDay =Object.values(dump.sites).map( // for every site
                (i) => Object.entries(i.visits.all.date).sort().slice(-7).map( // get the 7 latest dates
                    (i) => i[1]).reduce(function(pv, cv) {return pv + cv; }, 0) / 7 // sum them and divide by 7
            ).reduce(function(pv, cv) { return pv + cv;}, 0) // sum all sites

            var suggestion = FIVE_EUROS_SUGGESTION
            if (allHitsPerDay > 70){
                suggestion = SEVEN_EUROS_SUGGESTION
            }
            if (allHitsPerDay > 5000){
                suggestion = TWENTYFIVE_EUROS_SUGGESTION
            }

            this.querySelectorAll('.highlightable')[suggestion].classList.add('highlight')
            this.querySelector("#modal-pwyw .highlight + div input").setAttribute('checked', 'checked')

            let val = $("input[type=radio][name=plan]:checked").val()
            $("#paypal-btn-" + val).css('display', 'block')

        }

    }
);
