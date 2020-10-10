
customElements.define(tagName(),
    class extends BaseGraph {

    getChart(){
            var date_keys;
            var date_vals;
            [date_keys, date_vals] = dGetNormalizedDateData(timedData.all.date) // GLOBAL STATE
    return  {
        type: 'bar',
        data: {
            labels: date_keys,
            datasets: [{
                maxBarThickness: 15,
                data: date_vals,
                label: 'Visits',
                backgroundColor: this.makeGradient(),
                borderColor: orange,
                pointBorderColor: orange,
                pointBackgroundColor: orange,
            }, ],
        },
        options: {
            title: {
                display: true,
                text: "All days"
            },
            tooltips: {
                enabled: true,
                mode: "index",
                intersect: false,
            },
            scales: {
                yAxes: [{
                    gridLines: {
                        display: true,
                    },
                    "scaleLabel": {
                        display: true,
                        labelString: "Visits",
                    },
                    ticks: {
                        beginAtZero: true,
                        userCallback: function(label) {
                            if (Math.floor(label) === label) return kFormat(label);
                        },
                    },
                }, ],
                xAxes: [{
                    gridLines: {
                        display: false,
                    },
                    type: 'time',
                    time: {
                        unit: 'week'
                    },
                    "scaleLabel": {
                        display: false,
                        //labelString: "Date",
                    },
                }, ]
            },
            legend: {
                display: false
            },
        },
    }
}})
