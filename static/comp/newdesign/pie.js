customElements.define(
    tagName(),
    class extends BaseGraph {
        getChart(devices) {
            var aggr = dGroupData(devices, 3)
            return {
                type: 'pie',
                data: {
                    labels: Object.keys(aggr),
                    datasets: [{
                        label: "Population (millions)",
                        backgroundColor: ["#147EFB", "#FC3158", "#53D769", "#FECB2E"],
                        hoverBorderColor: '#ffffff',
                        borderWidth: 2,
                        data: Object.values(aggr),
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
