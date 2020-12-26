customElements.define(
    tagName(),
    class extends HTMLElement {
        POSITIVE = "positive";
        STABILITY = "stability";
        NEGATIVE = "negative";

        draw(dates) {
            let title;
            let groupdedDates = dNormalizedDates(dates);
            let keys = groupdedDates[0];
            let vals = groupdedDates[1];
            if (vals.length === 0) {
                this.innerHTML = "<comp-nodata></comp-nodata>";
            } else if (vals.length < 3) {
                this.innerHTML = this.getTrend(
                    this.STABILITY,
                    null,
                    "Not enough data to determine trend"
                );
                return;
            } else {
                let labelPrev = keys[keys.length - 2];
                let labelPrevPrev = keys[keys.length - 3];
                let valPrev = vals[vals.length - 2];
                let valPrevPrev = vals[vals.length - 3];
                title = `Compares ${labelPrev} (${valPrev}) with ${labelPrevPrev} (${valPrevPrev})`;

                if (valPrevPrev + valPrevPrev <= 2) {
                    // soo little visits, we can't little calculate much
                    this.innerHTML = this.getTrend(this.STABILITY, null, title);
                    return;
                }

                let percent = Math.round((valPrev / valPrevPrev - 1) * 100);
                //let dd = vals.slice(0, -1)

                if (percent > 10) {
                    this.innerHTML = this.getTrend(
                        this.POSITIVE,
                        percent,
                        title
                    );
                    return;
                } else if (percent < -10) {
                    this.innerHTML = this.getTrend(
                        this.NEGATIVE,
                        percent,
                        title
                    );
                    return;
                } else {
                    this.innerHTML = this.getTrend(this.STABILITY, null, title);
                    return;
                }
            }
        }

        getTrend(trend, percent, title) {
            let percentAbs = Math.abs(percent);
            if (trend === this.POSITIVE) {
                return `
                   <div class="graph-dynamics">
                     <img src="img/rocket.png" srcset="img/rocket@2x.png 2x" width="60" height="60" alt="Rocket">
                     <div class="graph-dynamics-content gradient-green radius-lg">
                       <div class="dynamics positive caption" title="${escapeHtml(
                           title
                       )}">${escapeHtml(percentAbs)}%</div>
                       <div class="strong mt16 mb8">Positive dynamics</div>
                       <div class="caption gray mb32">You are on the right track :)</div>
                       <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
                     </div>
                   </div>`;
            } else if (trend === this.NEGATIVE) {
                return `
                   <div class="graph-dynamics">
                     <img src="img/volcano.png" srcset="img/volcano@2x.png 2x" width="60" height="60" alt="Volcano">
                     <div class="graph-dynamics-content gradient-red radius-lg">
                       <div class="dynamics negative caption" title="${escapeHtml(
                           title
                       )}">${escapeHtml(percentAbs)}%</div>
                       <div class="strong mt16 mb8">Negative dynamics</div>
                       <div class="caption gray mb32">Something went wrong :(</div>
                       <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
                     </div>
                   </div>`;
            } else if (trend === this.STABILITY) {
                return `
                   <div class="graph-dynamics">
                     <img src="img/grow.png" srcset="img/grow@2x.png 2x" width="60" height="60" alt="Grow">
                     <div class="graph-dynamics-content bg-gray radius-lg">
                       <div class="dynamics stability caption" title="${escapeHtml(
                           title
                       )}"></div>
                       <div class="strong mt16 mb8">Good stability</div>
                       <div class="caption gray mb32">But you need to grow!</div>
                       <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
                     </div>
                   </div>`;
            }
        }
    }
);
