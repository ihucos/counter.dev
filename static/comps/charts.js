customElements.define('counter-time',
    class extends HTMLElement {
        constructor() {
            super()
            this.attachShadow({
                mode: "open"
            });
            this.shadowRoot.innerHTML = "<canvas></canvas>"
            this.canvas = this.shadowRoot.children[0]
        }

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

            var sumHours = function(arr) {
                var sum = 0
                arr.forEach(el => sum += (entries[el] || 0))
                return sum
            }

            new Chart(this.canvas, {
                type: 'bar',
                data: {
                    labels: [
                        'Morning',
                        'Afternoon',
                        'Evening',
                        'Night',
                    ],
                    datasets: [{
                        maxBarThickness: 10,
                        data: emptyIfSumZero([
                            sumHours([5, 6, 7, 8, 9, 10, 11]),
                            sumHours([12, 13, 14, 15]),
                            sumHours([16, 17, 18, 19, 20, 21]),
                            sumHours([22, 23, 24, 0, 1, 2, 3, 4]),
                        ]),
                        backgroundColor: this.makeGradient(),
                    }, ],
                },
                options: {
                    tooltips: {
                        mode: 'index'
                    },
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: "Visits by time",
                        position: "top",
                    },
                    scales: {
                        yAxes: [{
                            gridLines: {
                                display: false,
                            },
                            ticks: {
                                display: false,
                                beginAtZero: true,
                            }
                        }, ],
                        xAxes: [{
                            gridLines: {
                                display: false,
                            },
                            ticks: {
                                beginAtZero: true,
                            }
                        }, ],
                    },
                },
            })
        }

    }
)
