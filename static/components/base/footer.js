customElements.define(
    tagName(),
    class extends HTMLElement {
        connectedCallback() {
            this.innerHTML = `
                    <footer>
                      <section class="footer">
                        <div class="content">
                          <div class="footer-logo">
                            <img
                              src="/img/logotype--gray.svg"
                              width="140"
                              height="32"
                              alt="Logotype"
                            />
                            <div class="caption gray">© 2022 Counter. All rights reserved.</div>
                          </div>
                          <nav class="nav-footer">
                            <div class="nav-footer-one">
                              <ul>
                                <li><a href="/blog">Blog</a></li>
                                <li><a href="mailto:hey@counter.dev" target="_blank" rel="nofollow">Feedback</a></li>
                                <li><a href="https://www.paypal.com/donate/?hosted_button_id=3AV353CXCEN9E" target="_blank" rel="nofollow">Donate</a></li>
                              </ul>
                            </div>
                            <div class="nav-footer-two">
                              <ul>
                                <li><a href="/pages/privacy.html" rel="nofollow">Privacy</a></li>
                                <li><a href="/pages/imprint.html" rel="nofollow">Imprint</a></li>
                              </ul>
                            </div>
                          </nav>
                          <div class="footer-contacts">
                            <div class="footer-contacts-social mb16">
                              <a
                                href="https://github.com/ihucos/counter.dev"
                                class="github mr16"
                                target="_blank"
                                rel="nofollow"
                              ></a>
                              <a href="https://twitter.com/DevCounter" class="twitter" target="_blank" rel="nofollow"></a>
                            </div>
                            <div class="caption gray">
                              Have a question? –
                              <a href="mailto:hey@counter.dev" class="caption gray underline" target="_blank" rel="nofollow"
                                >hey@counter.dev</a
                              >
                            </div>
                          </div>
                        </div>
                      </section>

                    </footer>`;

                    // SNEAK IN TRACKING CODE HERE
                    // smuggle in the tracking script here - different domain
                    // because we can't track counter.dev with counter.dev as an super
                    // edge case
                    if (
                      !sessionStorage.getItem("_swa") &&
                      document.referrer.indexOf(location.protocol + "//" + location.host) !==
                        0
                    ) {
                      fetch(
                        "https://simple-web-analytics.com/track?" +
                          new URLSearchParams({
                            id: "33671ad4-a966-4a52-b48f-56c92d10a678",
                            utcoffset: "1",
                            referrer: document.referrer,
                            screen: screen.width + "x" + screen.height,
                          })
                      );
                    }
                    sessionStorage.setItem("_swa", "1");
    }
    }
);
