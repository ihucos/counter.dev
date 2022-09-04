customElements.define(
    tagName(),
    class extends HTMLElement {
        draw(opts) {
            if (opts.meta.sessionless) {
                $(this).css("margin", "0");
                return;
            }

            this.innerHTML = `
              <a
                href="#modal-settings"
                class="btn-secondary btn-icon"
                rel="modal:open"
                ><img src="/img/settings.svg" width="24" height="24" alt="Settings"
              /></a>

              <!-- Settings modal -->
              <div id="modal-settings" style="display: none">
                <div class="modal-header">
                  <img src="/img/settings.svg" width="24" height="24" alt="Settings" />
                  <h3 class="ml16">Settings</h3>
                  <a href="#" class="btn-close" rel="modal:close"></a>
                </div>
                <div class="modal-content">
                  <!-- Tracking code -->
                  <div class="title mb16">Tracking code</div>
                  <counter-trackingcode></counter-trackingcode>
                  <!-- Danger -->
                  <div class="title mt24 mb16">Delete ${escapeHtml(
                      opts.cursite
                  )}</div>
                  <div class="danger gradient-red radius-lg">
                    <!-- Request delete -->
                    <div class="delete-request">
                      <div class="danger-message caption full mr16">
                        <img src="/img/alert.svg" width="24" height="24" alt="Alert" />
                        <span class="ml16"
                          >This website's data will be deleted permanently!</span
                        >
                      </div>
                      <button class="btn-white btn-danger btn-confirm">
                        Delete website
                      </button>
                    </div>
                    <!-- Confirm delete -->
                    <form class="delete-confirm" action="/deletesite" method="POST" style="display: none" id="site-delete">
                      <input
                        name="site"
                        type="hidden"
                        value="${escapeHtml(opts.cursite)}"
                      />
                      <input
                        name="confirmSite"
                        type="text"
                        class="confirm-input full mr16"
                        placeholder="Enter the domain to confirm"
                      />
                      <button class="btn-white btn-danger">Delete</button>
                    <formdiv>
                  </div>
                </div>
              </div>`;

            $(`#modal-settings .btn-confirm`).click(function () {
                $(`#modal-settings .delete-request`).hide();
                $(`#modal-settings .delete-confirm`).show();
                $(`#modal-settings .danger`).toggleClass(
                    "gradient-red bg-blue"
                );
                $(`#modal-settings .confirm-input`).focus();
            });

            // redraw modal if it is closed
            var parentThis = this;
            $("#modal-settings", this).on(
                $.modal.AFTER_CLOSE,
                function (event, modal) {
                    parentThis.draw(opts);
                }
            );

            simpleForm("#site-delete", "/dashboard");

            let tc = this.querySelector("counter-trackingcode");
            customElements.upgrade(tc);
            tc.draw(opts.uuid, opts.utcoffset);
        }
    }
);
