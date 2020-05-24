function post(name) {
    user = document.getElementById("user").value
    password = document.getElementById("password").value

    fetch("/" + name, {
        method: "POST",
        body: "user=" + encodeURIComponent(user) + '&password=' + encodeURIComponent(password),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
    }).then(resp => {
        if (resp.status == 200) {
            return resp.json()
        } else if (resp.status == 400) {
            return resp.text()
        } else {
            return "Bad server status code: " + resp.status
        }
    }).then(data => {
        if (typeof(data) === "object") {
            draw(user, data)
        } else {
            document.getElementById("alert").style.display = "block"
            document.getElementById("alert").innerHTML = escapeHtml(data)
        }
    })
}


function alwaysUpdate() {
    window.setInterval(function() {
        post("dashboard", true)
    }, 5000);
}


function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function demo(){
       document.getElementById("user").value = "demo"
       document.getElementById("user").focus()
       document.getElementById("password").value = "demodemo"
       document.getElementById("login_button").click()
}




function getUTCMinusElevenNow() {
    var date = new Date();
    var now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
        date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());

    d = new Date(now_utc);
    d.setHours(d.getHours() - 11)
    return d
}

function commaFormat(x) {
    return Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function average(array) {
    return array.reduce((acc, next) => acc + next) / array.length;
}

const median = arr => {
    const mid = Math.floor(arr.length / 2),
        nums = [...arr].sort((a, b) => a - b);
    return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

function drawGraphHeader(numbers) {
    document.getElementById("median").innerHTML = escapeHtml(commaFormat(median(numbers.slice(-7))))
    document.getElementById("average").innerHTML = escapeHtml(commaFormat(average(numbers.slice(-7))))
    document.getElementById("today").innerHTML = escapeHtml(commaFormat(numbers.slice(-1)[0]))

}

function drawUsername(user) {
    var x = document.getElementsByClassName("username");
    var i;
    for (i = 0; i < x.length; i++) {
        x[i].innerHTML = escapeHtml(user)
    }
}

function drawUTCOffsetVar(){
    offset = Math.round(-1 * new Date().getTimezoneOffset()/60)
    document.getElementById("utcoffset").innerHTML = offset
}

function drawList(elem_id, dataItem, title) {
    var elem = document.getElementById(elem_id)


    elem.innerHTML = "<h4>" + escapeHtml(title) + "</h4>"
    if (Object.keys(dataItem).length === 0 && dataItem.constructor === Object) {
        elem.innerHTML += '<span class="text-muted">Empty</span>'
        return
    }

    var list = [];
    for (var key in dataItem) {
        list.push([key, dataItem[key]]);
    }

    list.sort(function(a, b) {
        return b[1] - a[1];
    });

    for (var i = 0; i < list.length; i++) {
        elem.innerHTML += '<li>' + escapeHtml(list[i][0]) + ' <small class="text-muted">' + escapeHtml(commaFormat(list[i][1])) + '</small> <br/></li>'
    }
}

function drawMap(){
      jQuery('#world').vectorMap({
            map: 'world_en',
            backgroundColor: '#fff',
            color: '#ffffff',
            hoverOpacity: 0.7,
            selectedColor: null,
            enableZoom: false,
            showTooltip: true,
            borderOpacity: 0.8,
            color: '#eee',
            values: data.country,
            scaleColors: ['#C8EEFF', '#006491'],
            normalizeFunction: 'polynomial',
    onLabelShow: function(event, label, region)
    {
        label[0].innerHTML += ' </br>' + (data.country[region] || "0") + " visits"
    }
  });
}


function drawTitle(user){
    document.title = "Simple Web Analytics for " + user
}


function draw(user, data) {
    window.data = data
    console.log(data)
    document.getElementById("page-index").style.display = "none"
    document.getElementById("page-graphs").style.display = "block"

    if (!window._timer){
        alwaysUpdate()
        window._timer = true
    }

    drawUsername(user)
    drawUTCOffsetVar()
    drawMap()
    drawTitle(user)

    orange = "#5c5c5c"


    function splitObject(obj, sort_keys) {
        var sortable = [];
        for (var key in obj) {
            sortable.push([key, obj[key]]);
        }
        if (sort_keys) {
            sortable.sort(function(a, b) {
                return a[0] - b[0];
            });
        } else {
            sortable.sort(function(a, b) {
                return b[1] - a[1];
            });
        }

        return [sortable.map(x => x[0]), sortable.map(x => x[1])]
    }

    var daysRange = function(s, e) {
        s = new Date(s)
        e = new Date(e)
        o = {}
        for (var a = [], d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            o[new Date(d).toISOString().substring(0, 10)] = 0;
        }
        return o;
    };

    function getNormalizedDateData() {
        keys = Object.keys(data.date)
        keys.sort((a, b) => {
            return a > b;
        });


        calc_min = getUTCMinusElevenNow()
        calc_min.setDate(calc_min.getDate() - 7)
        calc_min = calc_min.toISOString().substring(0, 10)

        if (keys.length != 0) {
            data_min = keys[0]
            if (new Date(data_min).getTime() < new Date(calc_min).getTime()) {
                min = data_min
            } else {
                min = calc_min
            }
        } else {
            min = calc_min
        }


        max = getUTCMinusElevenNow().toISOString().substring(0, 10)
        date_data = {...daysRange(min, max),
            ...data.date
        }

        return splitObject(date_data, true)
    }

    [date_keys, date_vals] = getNormalizedDateData()

    drawGraphHeader(date_vals)
    drawList("list_ref", data.ref, "Top Referrers")
    drawList("list_loc", data.loc, "Top Pages")
    drawList("list_browser", data.browser, "Top Browsers")
    drawList("list_platform", data.platform, "Top Platforms")
    drawList("list_lang", data.lang, "Top Languages")


    log_values = splitObject((data.log))[0]
    if (log_values.length != 0) {
        document.getElementById("log").innerHTML = escapeHtml(log_values.join("\n"))
    } else {
        document.getElementById("log_container").innerHTML = '<span class="text-muted">Empty</span>'
    }

    Chart.defaults.global.animation.duration = 0

    new Chart(document.getElementById("graph"), {
        type: 'line',
        data: {
            labels: date_keys,
            datasets: [{
                data: date_vals,
                label: 'Daily Views',
                backgroundColor: "rgba(0, 0, 0, 0)",
                borderColor: orange,
            }, ],
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false
            },
        },
    })

    function sumHours(arr) {
        sum = 0
        arr.forEach(el => sum += (data.hour[el] || 0))
        return sum
    }

    new Chart(document.getElementById("time"), {
        type: 'horizontalBar',
        data: {
            labels: [
                'Morning',
                'Afternoon',
                'Evening',
                'Night',
            ],
            datasets: [{
                data: [
                    sumHours([5, 6, 7, 8, 9, 10, 11]),
                    sumHours([12, 13, 14, 15]),
                    sumHours([16, 17, 18, 19, 20, 21]),
                    sumHours([22, 23, 24, 0, 1, 2, 3, 4]),
                ],
                barThickness: 7,
                backgroundColor: [
                    orange,
                    orange,
                    orange,
                    orange,
                ],
            }, ],
        },
        options: {
            tooltips: {
                mode: 'index'
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        display: false,
                        beginAtZero: true
                    }
                }, ],
                yAxes: [{
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }, ],
            },
        },
    })



    new Chart(document.getElementById("device"), {
        type: 'horizontalBar',
        data: {
            fontSize: 4,
            labels: [
                'Computer',
                'Phone',
                'Tablet',
                'Other',
            ],
            datasets: [{
                data: [
                    data.device["Computer"] || 0,
                    data.device["Phone"] || 0,
                    data.device["Tablet"] || 0,
                    ((data.device["TV"] || 0) + (data.device["Console"] || 0) + (data.device["Unknown"] || 0)),
                ],
                barThickness: 7,
                backgroundColor: [
                    orange,
                    orange,
                    orange,
                    orange,
                ],
            }, ],
        },
        options: {
            tooltips: {
                mode: 'index'
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        display: false,
                        beginAtZero: true
                    }
                }, ],
                yAxes: [{
                    ticks: {
                        display: false
                    },
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        beginAtZero: true
                    }
                }, ],
            },
        },
    })


    new Chart(document.getElementById("weekday"), {
        type: 'horizontalBar',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                data: [
                    data['weekday'][0] || 0,
                    data['weekday'][1] || 0,
                    data['weekday'][2] || 0,
                    data['weekday'][3] || 0,
                    data['weekday'][4] || 0,
                    data['weekday'][5] || 0,
                    data['weekday'][6] || 0,
                ],
                barThickness: 7,
                backgroundColor: [
                    orange,
                    orange,
                    orange,
                    orange,
                    orange,
                    orange,
                    orange,
                ],
            }, ],
        },
        options: {
            tooltips: {
                mode: 'index'
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        display: false,
                        beginAtZero: true
                    }
                }, ],
                yAxes: [{
                    gridLines: {
                        display: false,
                    },
                }, ],
            },
        },
    })
}
