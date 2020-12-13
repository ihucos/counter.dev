customElements.define(
    tagName(),
    class extends BaseGraph {
        //draw(dev){this.innerHTML='daaax'}
        getChart(dev) {
            return {
                type: 'pie',
                data: {
                    labels: ["Africa", "Asia", "Europe", "Latin America"],
                    datasets: [{
                        label: "Population (millions)",
                        backgroundColor: ["#147EFB", "#FC3158", "#53D769", "#FECB2E"],
                        borderWidth: 2,
                        data: [2478, 5267, 734, 784]
                    }]
                },
                options: {
                    cutoutPercentage: 33.33,
                    aspectRatio: 1,
                    legend: {
                        display: false,
                    }
                }
            }
        }
    })
