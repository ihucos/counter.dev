registeredCharts = []


function getSelectedTimeRange() {
    return document.getElementById('time-range').value
}



function postUserAction(endpoint, body, success, fail) {

    // first hide all alerts
    var x = document.getElementsByClassName("login-alert");
    var i;
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }


    fetch(endpoint, {
        method: "POST",
        body: body,
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
    }).then(arg => {
        if (typeof arg === 'string' || arg instanceof String) {
            fail(arg)
        } else {
            handleUserData(arg)
            success()
        }
    })
}


function register() {
    window.viaRegister = true
    var user = document.getElementById("reg_user").value
    var password = document.getElementById("reg_password").value
    var body = "user=" + encodeURIComponent(user) + '&password=' + encodeURIComponent(password) + '&utcoffset=' + getUTCOffset()
    pageOnly("loading")
    postUserAction("/register", body, () => {
        getDataAndUpdateAlways()
    }, (errMsg) => {
        pageOnly("page-index")
        document.getElementById("alert_register").style.display = "block"
        document.getElementById("alert_register").innerHTML = escapeHtml(errMsg)
    })
}

function login() {
    window.viaRegister = false
    var user = document.getElementById("login_user").value
    var password = document.getElementById("login_password").value
    var body = "user=" + encodeURIComponent(user) + '&password=' + encodeURIComponent(password) + '&utcoffset=' + getUTCOffset()
    pageOnly("loading")
    postUserAction("/login", body, () => {
        getDataAndUpdateAlways()
    }, (errMsg) => {
        pageOnly("page-index")
        document.getElementById("alert_login").style.display = "block"
        document.getElementById("alert_login").innerHTML = escapeHtml(errMsg)
    })
}


function handleUserData(resp) {
    prefOption = document.querySelector("select#time-range option[value=" + resp.prefs.range + "]")
    if (prefOption !== null) {
        prefOption.selected = true
    }

    prefOption = document.querySelector("select#site-selector option[value=\"" + resp.prefs.site + "\"]")
    if (prefOption !== null) {
        prefOption.selected = true
    }

    metaData = resp.meta // metaData is global
    user = resp.meta.user // user is global
    handleSiteLinksData(resp.site_links, resp.prefs.site)
    drawMetaVars()
}


function handleDataResp(resp) {
    handleSiteLinksData(resp.site_links)
    if (JSON.stringify(resp.visits) !== JSON.stringify(window.timedData || {})) {
        timedData = resp.visits // timedData is global
        data = timedData[getSelectedTimeRange()] // data is global
        logData = resp.logs // logData is global
        console.log("new data")
        console.log(timedData)
        if (!(Object.keys(resp.site_links).length === 0 && resp.site_links.constructor === Object)) {
            draw()
        }
    }

}

function handleSiteLinksData(siteLinks, prefSite) {
    if ((Object.keys(siteLinks).length === 0 && siteLinks.constructor === Object) && pageNow() !== 'page-setup') {
        pageOnly("page-setup")
    }
    drawSiteSelector(siteLinks, getSelectedSite() || prefSite || "")
}


function getDataAndUpdate() {
    fetch("/ping?" + (getSelectedSite() || "dummysite"), {
        method: "GET",
    }).then(resp => {
        if (resp.status == 200) {
            return resp.json()
        } else if (resp.status == 403) {
            if (pageNow() === "page-graphs") {
                location.href = window.location.href.split('#')[0]
            }
            pageOnly("page-index")
            return null
        } else {
            alert("Bad server status code: " + resp.status)
            return null
        }
    }).then(resp => {
        if (resp != null) {
            handleDataResp(resp)
        }
    })
}

function demo() {
    pressLogin("counter", "demodemo")
}


function pressLogin(user, password) {
    document.getElementById("login_user").value = user
    document.getElementById("login_user").focus()
    document.getElementById("login_password").value = password
    document.getElementById("login_button").click()
}




function onTimeRangeChanged() {
    var range = getSelectedTimeRange()
    data = timedData[range]
    draw()
    fetch("/setPrefRange?" + encodeURIComponent(range))
}

function onSiteChanged() {
    fetch("/setPrefSite?" + encodeURIComponent(getSelectedSite()))
    getDataAndUpdate()
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function downloadData() {
    var csv = ""
    Object.keys(data).forEach(function(namespace, _) {
        Object.keys(data[namespace]).forEach(function(key, _) {
            var val = data[namespace][key]
            csv += (namespace + ',').padEnd(12, ' ') + (key + ',').padEnd(12, ' ') + val + '\n'
        });
    });
    download("swa-" + user + "-data.csv", csv)
}

function onclickOverlay() {
    if (event.target.id === "overlay") {
        pageOff("overlay")
    }
}

tabActive = "bg-gray-200 inline-block border rounded py-2 px-4 text-dark-900 font-semibold mt-2"
tabNotActive = "bg-white inline-block py-2 px-4 text-blue-500 hover:text-blue-800 font-semibold mt-2 shadow"
tabPanels = document.querySelectorAll('#tabs_content > *')
tabTabs = document.querySelectorAll('#tabs_tabs li a')

function openTab(elemId) {
    for (let panel of tabPanels) {
        panel.style.display = "none"
    }
    for (let tab of tabTabs) {
        tab.className = tabNotActive
    }
    tabPanels[elemId].style.display = "block"
    tabTabs[elemId].className = tabActive
}
openTab(0)


function handleHash() {

    // There are external links to this, so it has to be maintained
    if (location.hash === "#demo") {
        document.getElementById("demo").click()

    } else if (location.hash.startsWith('#login,') || location.hash.startsWith('#share,')) {
        var parts = location.hash.split(',')

        // remove the hash of the url and anythin after it
        location.hash = ""

        var user = parts[1]
        var password = parts[2]
        if (user !== undefined && password !== undefined) {
            pressLogin(user, password)
        }
    }
}

function pageOnly(name) {
    pageAllOff()
    pageOn(name)
}

function pageAllOff() {
    for (let section of document.querySelectorAll('section')) {
        section.style.display = 'none'
    }
}

function pageOn(name) {
    console.log("pageOn: " + name)
    document.querySelector('section[id="' + name + '"]').style.display = "block"
}

function pageOff(name) {
    document.querySelector('section[id="' + name + '"]').style.display = "none"
}


function pageNow(name) {
    var sections = document.getElementsByTagName('section')
    for (var i = 0; i < sections.length; i++) {
        if (sections[i].style.display == "block") {
            return sections[i].id
        }
    }
}


function ifUser(trueCallback, falseCallback) {
    fetch("/user").then(resp => {
        if (resp.status == 200) {
            return resp.json()
        } else if (resp.status == 403) {
            return null
        } else {
            return "Bad server status code: " + resp.status
        }
    }).then(userData => {
        if (userData !== null) {
            trueCallback(userData)
        } else {
            falseCallback()
        }
    })
}

function getSelectedSite() {
    return document.getElementById("site-selector").value
}

function getDataAndUpdateAlways() {
    getDataAndUpdate()
    setInterval(function() {
        if (pageNow() === "page-graphs" || pageNow() === "page-setup") {
            getDataAndUpdate();
        }
    }, 5000);

}

function main() {
    pageOnly("loading")
    handleHash()
    ifUser(userData => {
            handleUserData(userData)
            getDataAndUpdateAlways()
        },
        () => {
            if (pageNow() === "loading") {
                pageOnly("page-index")
            }
        })
}