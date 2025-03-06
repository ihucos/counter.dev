customElements.define(
    tagName(),
    class extends HTMLElement {
        POSITIVE = "positive";
        STABILITY = "stability";
        NEGATIVE = "negative";

        draw(dates, utcoffset) {
            let text;
            let groupdedDates = dGroupDates(dates);
            let keys = groupdedDates[0];
            let vals = groupdedDates[1];
            this.classList.add("graph-dynamics");
            if (vals.length === 0) {
                this.classList.add("nodata");
                this.innerHTML = "<dashboard-nodata></dashboard-nodata>";
            } else if (vals.length < 3) {
                this.drawTrend(this.STABILITY, null, "Not enough data");
            } else {
                let labelPrev = keys[keys.length - 2];
                let labelPrevPrev = keys[keys.length - 3];
                let valPrev = vals[vals.length - 2];
                let valPrevPrev = vals[vals.length - 3];
                text = `Comparing ${labelPrev} and ${labelPrevPrev}`;

                if (valPrevPrev + valPrevPrev <= 2) {
                    // soo little visits, we can't calculate much
                    text = `But few data points in ${labelPrev} and ${labelPrevPrev}`;
                    this.drawTrend(this.STABILITY, null, text);
                    return;
                }

                let percent = Math.round((valPrev / valPrevPrev - 1) * 100);
                //let dd = vals.slice(0, -1)

                if (percent > 10) {
                    this.drawTrend(this.POSITIVE, percent, text);
                    return;
                } else if (percent < -10) {
                    this.drawTrend(this.NEGATIVE, percent, text);
                    return;
                } else {
                    this.drawTrend(this.STABILITY, null, text);
                    return;
                }
            }
        }

        drawTrend(trend, percent, text) {
            let percentAbs;
            if (percent !== null) {
                percentAbs = Math.abs(percent) + "%";
            } else {
                percentAbs = "";
            }
            if (trend === this.POSITIVE) {
                this.innerHTML = `
                 <img src="/img/rocket.png" srcset="img/rocket@2x.png 2x" width="60" height="60" alt="Rocket">
                 <div class="graph-dynamics-content gradient-green radius-lg">
                   <div class="dynamics positive caption" title="${escapeHtml(
                       text
                   )}">
                     ${escapeHtml(percentAbs)}
                   </div>
                   <div class="strong mt16 mb8">Positive dynamics</div>
                     <div class="caption gray mb32"
                          style="padding-left: 4px; padding-right: 4px;">
                        You are on the right track :)
                     </div>
                   <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
                 </div>`;
            } else if (trend === this.NEGATIVE) {
                this.innerHTML = `
                 <img src="/img/volcano.png" srcset="img/volcano@2x.png 2x" width="60" height="60" alt="Volcano">
                 <div class="graph-dynamics-content gradient-red radius-lg">
                   <div class="dynamics negative caption" title="${escapeHtml(
                       text
                   )}">
                     ${escapeHtml(percentAbs)}
                   </div>
                   <div class="strong mt16 mb8">Negative dynamics</div>
                     <div class="caption gray mb32"
                          style="padding-left: 4px; padding-right: 4px;">
                       Something went wrong :(
                     </div>
                   <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
                 </div>`;
            } else if (trend === this.STABILITY) {
                this.innerHTML = `
                 <img src="/img/grow.png" srcset="img/grow@2x.png 2x" width="60" height="60" alt="Grow">
                 <div class="graph-dynamics-content bg-gray radius-lg">
                   <div class="dynamics stability caption" title="${escapeHtml(
                       text
                   )}">
                     ${escapeHtml(percentAbs)}
                   </div>
                   <div class="strong mt16 mb8">Good stability</div>
                     <div class="caption gray mb32"
                          style="padding-left: 4px; padding-right: 4px;">
                       But you need to grow!
                     </div>
                   <a href="#modal-tips" class="btn-white" rel="modal:open">Our tips</a>
                 </div>`;
            } else {
                alert("unknown trend " + trend);
            }
        }
    }
);
