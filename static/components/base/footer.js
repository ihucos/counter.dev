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
                            <div class="caption gray">© 2025 Counter. All rights reserved.</div>
                          </div>
                          <nav class="nav-footer">
                            <div class="nav-footer-one">
                              <ul>
                                <li><a href="/blog">Blog</a></li>
                                <li><a href="/help/">Help</a></li>
                                <li><a href="#modal-feedback" rel="modal:open">Feedback</a></li>
                              </ul>
                            </div>
                            <div class="nav-footer-two">
                              <ul>
                                <li><a href="/pages/privacy.html" rel="nofollow">Privacy</a></li>
                                <li><a href="/pages/imprint.html" rel="nofollow">Imprint</a></li>
                                <li><a href="mailto:hey@counter.dev">Contact</a></li>
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
