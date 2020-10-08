
class BaseGraph extends HTMLElement {
        makeGradient(alpha1, alpha2) {
            alpha1 = (typeof alpha1 !== 'undefined') ? alpha1 : 0.6;
            alpha2 = (typeof alpha2 !== 'undefined') ? alpha2 : 1;
            var ctx = this.canvas.getContext("2d")
            var gradientStroke = ctx.createLinearGradient(0, 0, 0, 200);
            gradientStroke.addColorStop(0, "rgba(30, 135, 240, " + alpha1 + ")");
            gradientStroke.addColorStop(1, "rgba(30, 135, 240, " + alpha2 + ")");
            return gradientStroke
        }

        set entries(entries) {
            this.innerHTML = "<canvas></canvas>"
            this.canvas = this.children[0]
            new Chart(this.canvas, this.getChart(entries))
        }


}
