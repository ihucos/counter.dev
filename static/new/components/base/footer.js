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
            <div class="caption gray">© 2020 Counter. All rights reserved.</div>
          </div>
          <nav class="nav-footer">
            <div class="nav-footer-one">
              <ul>
                <li><a href="#" target="_blank" rel="nofollow">Blog</a></li>
                <li><a href="#" target="_blank" rel="nofollow">Feedback</a></li>
                <li><a href="#" target="_blank" rel="nofollow">Donate</a></li>
              </ul>
            </div>
            <div class="nav-footer-two">
              <ul>
                <li>
                  <a href="#" target="_blank" rel="nofollow">Changelog</a>
                </li>
                <li><a href="#" target="_blank" rel="nofollow">Roadmap</a></li>
                <li><a href="#" target="_blank" rel="nofollow">Privacy</a></li>
              </ul>
            </div>
          </nav>
          <div class="footer-contacts">
            <div class="footer-contacts-social mb16">
              <a
                href="#"
                class="github mr16"
                target="_blank"
                rel="nofollow"
              ></a>
              <a href="#" class="twitter" target="_blank" rel="nofollow"></a>
            </div>
            <div class="caption gray mb8">
              Developed by
              <a href="#" class="gray underline">Naive&nbsp;Team</a>
            </div>
            <div class="caption gray">
              Have a question? –
              <a href="mailto:hey@counter.dev" class="caption gray underline"
                >hey@counter.dev</a
              >
            </div>
          </div>
        </div>
      </section>
    </footer>
            `
        }
    }
);
