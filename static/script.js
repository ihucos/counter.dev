

function post(name) {
    user = document.getElementById("user").value
    password = document.getElementById("password").value

    document.getElementById("alert").style.display = "none"
    document.getElementById("alert").innerHTML = ""

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


function showTrackingCode(){
        document.getElementById("tracking-code").style.display = "block"
        document.getElementById("tracking-code-button").innerHTML = "Hide Tracking Code"
}

function hideTrackingCode(){
        document.getElementById("tracking-code").style.display = "none"
        document.getElementById("tracking-code-button").innerHTML = "Show Tracking Code"
}

function toggleTrackingCode(){
    var elem = document.getElementById("tracking-code")
    if (elem.style.display === "none"){
        showTrackingCode()
    } else {
        hideTrackingCode()
    }
}


function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function demo() {
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

function kFormat(num) {
    num = Math.floor(num)
    return Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'K' : Math.sign(num) * Math.abs(num) + ""
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
    document.getElementById("median").innerHTML = escapeHtml(kFormat(median(numbers.slice(-7))))
    document.getElementById("average").innerHTML = escapeHtml(kFormat(average(numbers.slice(-7))))
    document.getElementById("today").innerHTML = escapeHtml(commaFormat(numbers.slice(-1)[0]))

}

function drawUsername(user) {
    var x = document.getElementsByClassName("username");
    var i;
    for (i = 0; i < x.length; i++) {
        x[i].innerHTML = escapeHtml(user)
    }
}

function drawUTCOffsetVar() {
    offset = Math.round(-1 * new Date().getTimezoneOffset() / 60)
    document.getElementById("utcoffset").innerHTML = offset
}

function drawList(elem_id, dataItem, title, maxEntries) {
    var elem = document.getElementById(elem_id)

    var showAll = elem.getAttribute("data-showall", "1")

    elem.innerHTML = "<h5>" + escapeHtml(title) + "</h5>"
    if (Object.keys(dataItem).length === 0 && dataItem.constructor === Object) {
        elem.innerHTML += '<span class="text-muted">Empty</span>'
        return
    }

    var completeList = [];
    for (var key in dataItem) {
        completeList.push([key, dataItem[key]]);
    }

    completeList.sort(function(a, b) {
        return b[1] - a[1];
    });

    if (showAll){
        var list = completeList
    } else {
        var list = completeList.slice(0, maxEntries)
    }

    listTotal = 0
    for (var i = 0; i < list.length; i++) {
        listTotal += list[i][1]
    }

    html = '<table class="top">'
    for (var i = 0; i < list.length; i++) {
        html += '<tr>'
        html += '<th style="padding-right: 0.5em;">' + escapeHtml(kFormat(list[i][1])) + '</th>'
        html += '<td style="position: relative; z-axis: 100; width: 100%;">'
        percent = list[i][1] / listTotal * 100
        html += '<div style="position: absolute; bottom: 0px; width: ' + percent + '%; height: 2px; background-color: #2F6CA2"></div>'
        html += escapeHtml(list[i][0]) + '</td>'
        html += "</tr>"
    }
    html += "</table>"

    if (completeList.length > maxEntries){
        if (!showAll){
            html += '<a href="#" onclick=\'document.getElementById("'+elem_id+'").setAttribute("data-showall", "1"); draw(user, data); return false\'>Expand</a>'
        } else {
            html += '<a href="#" onclick=\'document.getElementById("'+elem_id+'").removeAttribute("data-showall"); draw(user, data); return false\'>Collapse</a>'
        }
    }


    elem.innerHTML += html
}


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


function resolveCountry(code){
    entry = JQVMap.maps["world_en"].paths[code]
    if (entry){
        return entry["name"]
    } else {
        return "Unknown"
    }
}



function drawLog(maxEntries) {

    var showAll = document.getElementById("log_body").getAttribute("data-showall", "1")

    var completeLines = Object.keys(data.log).reverse()
    
    if (showAll){
        var lines = completeLines
    } else {
        var lines = completeLines.slice(0, maxEntries)
    }

    var html = ''
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        match = (/\[(.*?) (.*?):..\] (.*?) (.*?) (.*)/g).exec(line)
        if (match === null) {
            continue
        }
        var logDate = match[1]
        var logTime = match[2]
        var logCountry = match[3].toLowerCase()
        var logReferrer = match[4]
        var logUserAgent = match[5]

        // UGLY HACK, remove in a couple of months or so: June 2020
        if (logReferrer === "Mozilla/5.0") {
            logReferrer = ""
            logUserAgent = "Mozilla/5.0 " + logUserAgent
        }

        html += "<tr>"
        html += "<td>" + escapeHtml(logDate) + "</td>"
        html += "<td>" + escapeHtml(logTime) + "</td>"

        if (logCountry === '' || logCountry === 'xx') {
            html += '<td>-</td>'
        } else {
            html += '<td> <img title="' + escapeHtml(resolveCountry(logCountry)) + '" src="/famfamfam_flags/gif/' + escapeHtml(logCountry) + '.gif"></img></td>'
        }

        if (logReferrer === "") {
            html += "<td>-</td>"
        } else {
            try {
                var url = new URL(logReferrer)
            } catch (err) {
                var url = null
            }
            if (url === null) {
                html += '<td>?</td>'
            } else {
                html += '<td><a target="_blank" href="' + escapeHtml(logReferrer) + '">' + escapeHtml(url.host) + '</a></td>'
            }

        }
        html += "<td>" + escapeHtml(logUserAgent) + "</td>"
        html += "</tr>"

    }
    if (html === "") {
        document.getElementById("log_container").innerHTML = '<span class="text-muted">Empty</span>'
    } else {

        if (completeLines.length > maxEntries){
            if (!showAll){
                html += '<a href="#" onclick=\'document.getElementById("log_body").setAttribute("data-showall", "1"); draw(user, data); return false\'>Expand</a>'
            } else {
                html += '<a href="#" onclick=\'document.getElementById("log_body").removeAttribute("data-showall"); draw(user, data); return false\'>Collapse</a>'
            }
        }

        document.getElementById("log_body").innerHTML = html
    }

}

function drawMap() {
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
        onLabelShow: function(event, label, region) {
            label[0].innerHTML += (
                '&nbsp;<img title="' + escapeHtml(region) +
                '" src="/famfamfam_flags/gif/' +
                escapeHtml(region) +
                '.gif"></img> </br>' +
                (data.country[region] || "0") +
                " Visitors")
        }
    });
}


function drawTitle(user) {
    document.title = "Simple Web Analytics for " + user
}


function draw(user, data) {
    window.data = data
    console.log(data)
    document.getElementById("page-index").setAttribute('style', 'display: none !important');
    document.getElementById("page-graphs").style.display = "block"

    if (!window._inited) {
        alwaysUpdate()
        if (Object.keys(data.date).length === 0){
            showTrackingCode()
        } else {
            hideTrackingCode()
        }
        window._inited = true
    }

    drawUsername(user)
    drawUTCOffsetVar()
    drawMap()
    drawTitle(user)

    orange = "#2F6CA2"


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
    drawList("list_ref", data.ref, "Top Referrers", 5)
    drawList("list_loc", data.loc, "Top Landing Pages", 5)
    drawList("list_browser", data.browser, "Top Browsers", 5)
    drawList("list_platform", data.platform, "Top Platforms", 5)
    drawList("list_device", data.device, "Top Devices", 5)
    drawLog(5)


    Chart.defaults.global.animation.duration = 0
    normalFont = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'
    normalFontColor = '#212529'

    new Chart(document.getElementById("graph"), {
        type: 'line',
        data: {
            labels: date_keys,
            datasets: [{
                data: date_vals,
                label: 'Visitors',
                backgroundColor: "rgba(0, 0, 0, 0)",
                borderColor: orange,


                pointBorderColor: orange,
                pointBackgroundColor: orange,
            }, ],
        },
        options: {
            tooltips: {
                enabled: true,
                mode: "index",
                intersect: false,
            },
            scales: {
                yAxes: [{
                    "scaleLabel": {
                        "display": true,
                        "labelString": "Visits"
                    },
                    ticks: {
                        beginAtZero: true,
                        userCallback: function(label) {
                            if (Math.floor(label) === label) return kFormat(label);
                        },
                    },
                }, ]
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
                        beginAtZero: true,
                    }
                }, ],
                yAxes: [{
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        beginAtZero: true,
                        fontFamily: normalFont,
                        fontColor: normalFontColor,
                        fontSize: 16,
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
                    ticks: {
                        beginAtZero: true,
                        fontFamily: normalFont,
                        fontColor: normalFontColor,
                        fontSize: 16,
                    }
                }, ],
            },
        },
    })
}
