class BaseGraph extends HTMLElement {

    pieBorderColor = 'white'
    pieBorderWidth = 1.2

    palette = [
        "#1e87f0",
        "hsl(28, 45%, 50%)",
        "hsl(118, 45%, 50%)",
        "hsl(298, 35%, 60%)",
    ]


    makeGradient(alpha1, alpha2) {
        alpha1 = (typeof alpha1 !== 'undefined') ? alpha1 : 0.6;
        alpha2 = (typeof alpha2 !== 'undefined') ? alpha2 : 1;
        var ctx = this.canvas.getContext("2d")
        var gradientStroke = ctx.createLinearGradient(0, 0, 0, 200);
        gradientStroke.addColorStop(0, "rgba(30, 135, 240, " + alpha1 + ")");
        gradientStroke.addColorStop(1, "rgba(30, 135, 240, " + alpha2 + ")");
        return gradientStroke
    }

    draw(...args) {
        this.innerHTML = "<canvas></canvas>"
        this.canvas = this.children[0]
        var chartData = this.getChart(...args)
        if (chartData.data.datasets[0].data.length === 0){
            this.innerHTML = "<comp-nodata></comp-nodata>"
        } else {
            new Chart(this.canvas, chartData)
        }
    }


}


class BasePie extends BaseGraph {

    getChart(entries) {

        entries = dGroupData(entries, 3)

        var list = [];
        for (var key in entries) {
            list.push([key, entries[key]]);
        }
        list.sort(function(a, b) {
            return b[1] - a[1];
        });

        return {
            type: 'pie',
            data: {
                labels: list.map(x => x[0]),
                datasets: [{
                    borderWidth: this.pieBorderWidth,
                    borderColor: this.pieBorderColor,
                    data: list.map(x => x[1]),
                    backgroundColor: this.palette,
                }, ],
            },
            options: {
                cutoutPercentage: 35,
                tooltips: {
                    mode: 'index'
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: 'true'
                    },
                    align: 'center'
                },
                title: {
                    display: true,
                    text: this.title
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            display: false,
                        },
                        ticks: {
                            display: false,
                        }
                    }, ],
                },
            },
        }

    }
}
