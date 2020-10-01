normalFont = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"'
orange = "#1e87f0"

palette = [
    orange,
    "hsl(28, 45%, 50%)",
    "hsl(118, 45%, 50%)",
    "hsl(298, 35%, 60%)",


]

// I don't completely get this one, but it is quite important
Chart.defaults.global.maintainAspectRatio = false

Chart.defaults.global.title.fontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"';
Chart.defaults.global.title.fontColor = "rgba(0,0,0, 0.7)";
Chart.defaults.global.title.fontSize = 16
Chart.defaults.global.title.lineHeight = 1.2
Chart.defaults.global.title.padding = 10
Chart.defaults.global.layout = {
    padding: {
        left: 5,
        right: 5,
        top: 10,
        bottom: 10
    }
}


pieBorderColor = 'white'
pieBorderWidth = 1.2

Chart.defaults.global.defaultFontFamily = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"';



defaultAnimation = Chart.defaults.global.animation

function drawMetaVars() {
    var els, i
    for (key in metaData) {
        els = document.getElementsByClassName("metavar_" + key);
        for (i = 0; i < els.length; i++) {
            els[i].innerHTML = escapeHtml(metaData[key])
        }
    }
}


function drawUTCOffsetVar() {
    document.getElementById("utcoffset").innerHTML = getUTCOffset()
}


function drawList(elem_id, dataItem, useLink, useFavicon) {
    var elem = document.getElementById(elem_id)

    if (Object.keys(dataItem).length === 0 && dataItem.constructor === Object) {
        elem.innerHTML = '<span class="text-muted">Empty</span>'
        return
    }
    elem.innerHTML = ''

    var completeList = [];
    for (var key in dataItem) {
        completeList.push([key, dataItem[key]]);
    }

    completeList.sort(function(a, b) {
        return b[1] - a[1];
    });

    var list = completeList

    var listTotal = 0
    for (var i = 0; i < completeList.length; i++) {
        listTotal += completeList[i][1]
    }

    var html = '<table>'
    for (var i = 0; i < list.length; i++) {
        var percent = list[i][1] / listTotal * 100
        var val = commaFormat(list[i][1])
        html += '<td class="w-full truncate">'
        var key = escapeHtml(list[i][0])
        if (useLink) {
            if (!key.includes("://")) {
                var link = "//" + key
            } else {
                var link = key
            }

            if (useFavicon) {
                html += "<img src='https://icons.duckduckgo.com/ip3/" + key + ".ico' style='height: 0.8em; width: 0.8em; display: inline-block'/>"
            }
            html += "<a class='link' target='_blank' href='" + link + "'>" + key + '</a>'
        } else {
            html += key
        }
        html += '</td><td style="white-space: nowrap"><b>'
        html += escapeHtml(val)
        html += '</b></td>'
        html += '<td style="white-space: nowrap;" class="text-sm text-gray-700">'
        var percentRepr = Math.round(percent) + '%'
        if (percentRepr === '0%') {
            percentRepr = '<1%'
        }
        html += escapeHtml(percentRepr)
        html += '</td>'

        html += "</tr>"
    }
    html += "</table>"

    elem.innerHTML = html
}



function drawLog() {

    var completeLines = Object.keys(logData).reverse()

    var lines = completeLines

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
        html += "<td class='whitespace-no-wrap'>" + escapeHtml(logDate) + "</td>"
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
                html += '<td class="whitespace-no-wrap"><a class="link" target="_blank" href="' + escapeHtml(logReferrer) + '">' + escapeHtml(url.host) + '</a></td>'
            }

        }
        html += "<td class='truncate'>" + escapeHtml(logUserAgent) + "</td>"
        html += "</tr>"

    }
    if (html !== "") {
        document.getElementById("log_body").innerHTML = html
    }
}

function drawMap(elemId) {
    jQuery("#world svg").remove()
    jQuery("#" + elemId).vectorMap({
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
        scaleColors: ['#73B4F3', '#0457A8'],
        normalizeFunction: 'polynomial',
        onLabelShow: function(event, label, region) {
            label[0].innerHTML += (
                '&nbsp;<img title="' + escapeHtml(region) +
                '" src="/famfamfam_flags/gif/' +
                escapeHtml(region) +
                '.gif"></img> </br>' +
                (data.country[region] || "0") +
                " Visits")
        }
    });
}


function drawTitle(user) {
    document.title = "Simple Web Analytics for " + user
}


function drawCountries(elemId, countries) {
    var elem = document.getElementById(elemId)

    if (Object.keys(countries).length === 0 && countries.constructor === Object) {
        elem.innerHTML = '<span class="text-muted">Empty</span>'
        return
    }
    elem.innerHTML = ''

    var list = [];
    for (var key in countries) {
        list.push([key, countries[key]]);
    }
    list.sort(function(a, b) {
        return b[1] - a[1];
    });

    var listTotal = 0
    for (var i = 0; i < list.length; i++) {
        listTotal += list[i][1]
    }

    var html = '<tr><th>Country</th><th colspan=2>Visits</th></tr>'
    for (var i = 0; i < list.length; i++) {
        var percent = list[i][1] / listTotal * 100
        var val = kFormat(list[i][1])
        html += '<tr>'
        html += '<td class="w-full">'
        var key = escapeHtml(list[i][0])
        html += '<img class="inline-block" src="/famfamfam_flags/gif/' + escapeHtml(key) + '.gif"/>'
        html += resolveCountry(key)
        html += "</td>"
        html += '<td style="white-space: nowrap;" class="text-center"><b>' + escapeHtml(val) + '</b></td>'
        html += '<td style="white-space: nowrap;" class="text-sm text-gray-700">'
        var percentRepr = Math.round(percent) + '%'
        if (percentRepr === '0%') {
            percentRepr = '<1%'
        }
        html += escapeHtml(percentRepr)
        html += '</td>'
        html += "</tr>"
    }

    elem.innerHTML += html
}

function drawPie(elemId, entries, title) {

    var list = [];
    for (var key in entries) {
        list.push([key, entries[key]]);
    }
    list.sort(function(a, b) {
        return b[1] - a[1];
    });

    registerChart(new Chart(document.getElementById(elemId), {
        type: 'pie',
        data: {
            labels: list.map(x => x[0]),
            datasets: [{
                borderWidth: pieBorderWidth,
                borderColor: pieBorderColor,
                data: list.map(x => x[1]),
                backgroundColor: palette,
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
                text: title
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
    }))

}


function drawTime() {
    sumHours = function(arr) {
        var sum = 0
        arr.forEach(el => sum += (data.hour[el] || 0))
        return sum
    }

    registerChart(new Chart(document.getElementById("time"), {
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
                data: [
                    sumHours([5, 6, 7, 8, 9, 10, 11]),
                    sumHours([12, 13, 14, 15]),
                    sumHours([16, 17, 18, 19, 20, 21]),
                    sumHours([22, 23, 24, 0, 1, 2, 3, 4]),
                ],
                backgroundColor: makeGradient('time'),
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
    }))
}


function drawRefChart(elemId) {
    var colors = [palette[2], palette[1], palette[0]]
    var otherColor = palette[3]
    var directColor = 'rgba(0,0,0,0.12)'

    var topRefs = dGroupData(data.ref, 3)
    var total = sum(Object.values(data.date))
    var ref = sum(Object.values(data.ref))
    var direct = total - ref
    topRefs["Direct"] = direct

    var entries = []
    for (const [key, value] of Object.entries(topRefs)) {
        if (key === "Direct") {
            var color = directColor
        } else if (key === "Other") {
            var color = otherColor
        } else {
            var color = colors.pop()
        }
        entries.push({
            label: key,
            value: value,
            color: color
        })
    }

    registerChart(new Chart(document.getElementById(elemId), {
        type: 'pie',
        data: {
            labels: entries.map(x => x.label),
            datasets: [{
                borderWidth: pieBorderWidth,
                borderColor: pieBorderColor,
                data: entries.map(x => x.value),
                backgroundColor: entries.map(x => x.color),
            }, ],
        },
        options: {
            //cutoutPercentage: 50,
            tooltips: {
                mode: 'index'
            },
            legend: {
                position: 'left',
                labels: {
                    usePointStyle: 'true'
                },
                align: 'center'
            },
            title: {
                display: true,
                text: "Top Traffic Sources",
                position: "top",
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        beginAtZero: true,
                        display: false,
                    }
                }, ],
                yAxes: [{
                    gridLines: {
                        display: false,
                    },
                    ticks: {
                        beginAtZero: true,
                        display: false,
                    }
                }, ],
            },
        },
    }))
}


function drawLastDays(elemId, date_keys, date_vals) {
    var num = 7
    registerChart(new Chart(document.getElementById(elemId), {
        type: 'line',
        data: {
            labels: date_keys.slice(-1 * num).map(x => moment(x).format("Do MMMM")),
            datasets: [{
                data: date_vals.slice(-1 * num),
                label: 'Visits',
                backgroundColor: makeGradient(elemId, 0.7, 0.1),
                borderColor: orange,
                //pointBorderColor: 'rgba(47, 108, 162, 0.5)',
                pointBackgroundColor: 'rgba(47, 108, 162, 1)',
                pointBorderWidth: 2,
            }, ],
        },
        options: {
            elements: {
                line: {
                    tension: 0
                }
            },
            title: {
                display: true,
                text: "Last Days"
            },
            tooltips: {
                enabled: true,
                mode: "index",
                intersect: false,
            },
            scales: {
                yAxes: [{
                    "scaleLabel": {
                        display: true,
                        labelString: "Visits",
                    },
                    ticks: {
                        maxTicksLimit: 5,
                        userCallback: function(label) {
                            if (Math.floor(label) === label) return kFormat(label);
                        },
                    },
                    gridLines: {
                        display: true,
                    },
                }, ],
                xAxes: [{
                    gridLines: {
                        display: false,
                    },
                }, ]
            },
            legend: {
                display: false
            },
        },
    }))

}

function drawScreenList(elemId, screenData) {
    if (Object.keys(screenData).length === 0 && screenData.constructor === Object) {
        document.getElementById(elemId).innerHTML = '<div class="font-xl p-5 italic">In order to view screen sizes of your users, you must include the updated <a href="#" onclick="pageOn(\"overlay\"); return false" class="link">tracking code</button>.</div>'
    } else {
        drawList("list_screen", screenData, false, false)
    }
}




function draw() {
    console.log("redrawing")
    destroyRegisteredCharts()

    var noData = Object.keys(timedData.all.date).length === 0 && data.date.constructor === Object
    if (noData) {
        pageOnly("page-setup")
        return
    } else {
        pageOnly("page-graphs")
        document.getElementById("share-account").style.display = "block" // hacky
    }

    drawUTCOffsetVar()
    drawMap("world")
    drawTitle(user)
    drawTime()
    drawRefChart("ref_chart")


    var date_keys;
    var date_vals;
    [date_keys, date_vals] = dGetNormalizedDateData(timedData.all.date)

    drawList("list_ref", data.ref, true, true)
    drawList("list_loc", data.loc, false, false)
    drawList("list_lang", data.lang, false, false)
    drawScreenList("list_screen", data.screen)
    drawCountries("world_list", data.country)
    drawLastDays("last_days_chart", date_keys, date_vals)
    drawPie("browser", dGroupData(data.browser, 3), "Browsers")
    drawPie("platform", dGroupData(data.platform, 3), "Platforms")
    drawPie("device", dGroupData(data.device, 3), "Devices")
    drawList("list_origin", data.origin, true, false)
    drawLog()

    //document.getElementById('val_visits').innerHTML = escapeHtml(date_vals.slice(-1)[0])

    registerChart(new Chart(document.getElementById("graph"), {
        type: 'bar',
        data: {
            labels: date_keys.map(x => x),
            datasets: [{
                maxBarThickness: 15,
                data: date_vals,
                label: 'Visits',
                backgroundColor: makeGradient("graph"),
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
    }))

    registerChart(new Chart(document.getElementById("hour"), {
        type: 'radar',
        data: {
            labels: [
                "24",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12",
                "13",
                "14",
                "15",
                "16",
                "17",
                "18",
                "19",
                "20",
                "21",
                "22",
                "23",
            ],
            datasets: [{
                data: [
                    data['hour'][0] || 0,
                    data['hour'][1] || 0,
                    data['hour'][2] || 0,
                    data['hour'][3] || 0,
                    data['hour'][4] || 0,
                    data['hour'][5] || 0,
                    data['hour'][6] || 0,
                    data['hour'][7] || 0,
                    data['hour'][8] || 0,
                    data['hour'][9] || 0,
                    data['hour'][10] || 0,
                    data['hour'][11] || 0,
                    data['hour'][12] || 0,
                    data['hour'][13] || 0,
                    data['hour'][14] || 0,
                    data['hour'][15] || 0,
                    data['hour'][16] || 0,
                    data['hour'][17] || 0,
                    data['hour'][18] || 0,
                    data['hour'][19] || 0,
                    data['hour'][20] || 0,
                    data['hour'][21] || 0,
                    data['hour'][22] || 0,
                    data['hour'][23] || 0,
                ],
                backgroundColor: makeGradient("hour"),
                borderWidth: 1,
                borderColor: 'transparent',
                pointBackgroundColor: 'white',
                pointRadius: 3,
                pointBorderColor: orange,
                lineTension: 0.4,
            }, ],
        },
        options: {
            title: {
                display: true,
                text: "Visits by hour",
                position: "top",
            },
            tooltips: {
                mode: 'index'
            },
            legend: {
                display: false
            },
            scale: {
                gridLines: {
                    display: true,
                    circular: true
                },
                ticks: {
                    display: false,
                }
            },
        },
    }))

    registerChart(new Chart(document.getElementById("weekday"), {
        type: 'radar',
        data: {
            labels: ['Mo.', 'Tu.', 'We.', 'Th.', 'Fr.', 'Sa.', 'Su.'],
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
                backgroundColor: makeGradient("weekday"),
                borderWidth: 1,
                borderColor: 'transparent',
                pointBackgroundColor: 'white',
                pointRadius: 3,
                pointBorderColor: orange,
                lineTension: 0.4,
            }, ],
        },
        options: {
            title: {
                display: true,
                text: 'Visits by weekday',
                position: "top",
            },
            tooltips: {
                mode: 'index'
            },
            legend: {
                display: false
            },
            scale: {
                gridLines: {
                    display: true,
                    circular: true
                },
                ticks: {
                    display: false,
                }
            },
        },
    }))
    disableAnimation()
}

function drawSiteSelector(sitesHash){
    var html = ""
    sites = Object.keys(sitesHash)
    sites.sort()
    for (let i in sites) {
      var site = sites[i]
      html += "<option value='" + escapeHtml(site) + "'>" + escapeHtml(site) + "</option>"
    }
    document.getElementById("site-selector").innerHTML = html
}
