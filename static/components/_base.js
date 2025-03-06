function tagName() {
    var tagName = new URL(document.currentScript.src).pathname
        .slice(1, -3)
        .replace(/\//g, "-");
    return tagName.slice(11);
}

class BaseGraph extends HTMLElement {
    draw(...args) {
        this.innerHTML = "<canvas></canvas>";
        //
        // I don't know why this is needed but its important
        this.style.display = "flex";

        this.canvas = this.children[0];
        var chartData = this.getChart(...args);
        if (chartData.data.datasets[0].data.length === 0) {
            this.innerHTML = "<dashboard-nodata></dashboard-nodata>";
        } else {
            new Chart(this.canvas, chartData);
        }
    }
}
