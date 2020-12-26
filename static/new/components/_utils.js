
function tagName() {
    var tagName = new URL(document.currentScript.src).pathname
        .slice(1, -3)
        .replace(/\//g, "-");
    return tagName.slice(15)
}


class BaseGraph extends HTMLElement {

    draw(...args) {
        this.innerHTML = "<canvas></canvas>";
        this.canvas = this.children[0];
        var chartData = this.getChart(...args);
        if (chartData.data.datasets[0].data.length === 0) {
            this.innerHTML = "<comp-nodata></comp-nodata>";
        } else {
            new Chart(this.canvas, chartData);
        }
    }
}
