customElements.define(
  tagName(),
  class extends HTMLElement {
    draw(dates) {
      this.innerHTML = `
        <div class="graph-dynamics">
          <img src="img/rocket.png" srcset="img/rocket@2x.png 2x" width="60" height="60" alt="Rocket">
          <div class="graph-dynamics-content gradient-green radius-lg">
            <div class="dynamics positive caption">62%</div>
            <div class="strong mt16 mb8">Positive dynamics</div>
            <div class="caption gray mb32">You are on the right track :)</div>
            <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
          </div>
        </div>
        <!-- Negative -->
        <div class="graph-dynamics" style="display: none;">
          <img src="img/volcano.png" srcset="img/volcano@2x.png 2x" width="60" height="60" alt="Volcano">
          <div class="graph-dynamics-content gradient-red radius-lg">
            <div class="dynamics negative caption">27%</div>
            <div class="strong mt16 mb8">Negative dynamics</div>
            <div class="caption gray mb32">Something went wrong :(</div>
            <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
          </div>
        </div>
        <!-- Stability -->
        <div class="graph-dynamics" style="display: none;">
          <img src="img/grow.png" srcset="img/grow@2x.png 2x" width="60" height="60" alt="Grow">
          <div class="graph-dynamics-content bg-gray radius-lg">
            <div class="dynamics stability caption"></div>
            <div class="strong mt16 mb8">Good stability</div>
            <div class="caption gray mb32">But you need to grow!</div>
            <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
          </div>
        </div>
        `
    }
  }
);
