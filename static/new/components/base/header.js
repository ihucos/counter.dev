customElements.define(
    tagName(),
    class extends HTMLElement {
        escapeHtml(unsafe) {
            return (unsafe + "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        connectedCallback() {
            this.innerHTML = `
                <header>
                  <!-- Navbar -->
                  <section class="navbar">
                    <div class="content">
                      <a href="https://counter.dev" class="logotype"></a>
                      <span class="version caption blue ml16">v 2.0</span>
                      <!-- Navigation -->
                      <nav class="nav-header">
                        <a href="#" class="mr32" target="_blank" rel="nofollow">Blog</a>
                        <a href="#" class="mr32" target="_blank" rel="nofollow">Feedback</a>
                        <a href="#" class="mr32" target="_blank" rel="nofollow">Donate</a>
                        <a
                          href="#"
                          class="github-blue mr16"
                          target="_blank"
                          rel="nofollow"
                        ></a>
                        <a
                          href="#"
                          class="twitter-blue mr32"
                          target="_blank"
                          rel="nofollow"
                        ></a>
                        ${
                            window.username === null
                                ? `
                        <span class="profile-guest">
                          <a href="#" class="ml32 mr32">Sign in</a>
                          <a href="#" class="btn-primary">Sign up</a>
                        </span>`
                                : `
                        <div class="dropdown">
                          <div class="profile-user">${this.escapeHtml(
                              username
                          )}</div>
                          <div class="dropdown-content">
                            <a href="#modal-account" rel="modal:open">Edit account</a>
                            <a href="/logout">Sign out</a>
                          </div>
                        </div>
                        `
                        }
                        <!-- /// -->
                      </nav>
                      <!-- Hamburger -->
                      <div class="hamburger-menu">
                        <input id="hamburger-toggle" type="checkbox" />
                        <label class="hamburger-btn" for="hamburger-toggle"></label>
                        <div class="hamburger-box">
                          <div class="hamburger-content">
                            <img src="img/avatar.svg" width="96" height="96" alt="Avatar" />
                            <!-- Navigation -->
                            <nav class="nav-header-mob">
                              <!-- Guest -->
                              <span class="mt48 mb48" style="display: none">
                                <a href="#" class="btn-primary mr16">Sign in</a>
                                <a href="#" class="btn-secondary">Sign up</a>
                              </span>
                              <!-- User -->
                              <span class="mt24">slomchinskiy</span>
                              <span class="mt24 mb48">
                                <a
                                  href="#modal-account"
                                  class="btn-primary mr16"
                                  rel="modal:open"
                                  onClick="document.getElementById('hamburger-toggle').checked=false"
                                  >Edit account</a
                                >
                                <a href="#" class="btn-secondary">Sign out</a>
                              </span>
                              <!-- /// -->
                              <a href="#" class="mb24" target="_blank" rel="nofollow"
                                >Blog</a
                              >
                              <a href="#" class="mb24" target="_blank" rel="nofollow"
                                >Feedback</a
                              >
                              <a href="#" target="_blank" rel="nofollow">Donate</a>
                              <span class="mt48">
                                <a
                                  href="#"
                                  class="github-blue mr24"
                                  target="_blank"
                                  rel="nofollow"
                                ></a>
                                <a
                                  href="#"
                                  class="twitter-blue"
                                  target="_blank"
                                  rel="nofollow"
                                ></a>
                              </span>
                            </nav>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </header>`;
        }
    }
);
