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
                              src="img/logotype--gray.svg"
                              width="140"
                              height="32"
                              alt="Logotype"
                            />
                            <div class="caption gray">© 2021 Counter. All rights reserved.</div>
                          </div>
                          <nav class="nav-footer">
                            <div class="nav-footer-one">
                              <ul>
                                <!-- <li><a href="#" target="_blank" rel="nofollow">Blog</a></li> -->
                                <li><a href="mailto:hey@counter.dev" target="_blank" rel="nofollow">Feedback</a></li>
                                <li><a href="https://www.paypal.com/donate/?hosted_button_id=GYAY2HGG2YLKL&locale.x=en_DE" target="_blank" rel="nofollow">Donate</a></li>
                              </ul>
                            </div>
                            <div class="nav-footer-two">
                              <ul>
                                <li><a href="privacy.html" target="_blank" rel="nofollow">Privacy</a></li>
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
                              <a href="https://twitter.com/NaiveTeamHQ" class="twitter" target="_blank" rel="nofollow"></a>
                            </div>
                            <div class="caption gray mb8">
                              Developed by
                              <a href="//naive.team" class="gray underline" target="_blank" rel="nofollow">Naive&nbsp;Team</a>
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
        }
    }
);
