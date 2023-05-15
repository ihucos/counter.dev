
window.state = {}
Chart.defaults.global.tooltips = {
    ...Chart.defaults.global.tooltips,
    ...{
        enabled: true,
        mode: "index",
        borderWidth: 1,
        cornerRadius: 2,
        xPadding: 8,
        yPadding: 12,
        backgroundColor: "#ffffff",
        borderColor: "#121212",

        titleFontSize: 12,
        titleFontFamily: "Nunito Sans",
        titleFontColor: "#121212",

        bodyFontSize: 12,
        bodyFontFamily: "Nunito Sans",
        bodyFontColor: "#121212",
        displayColors: false,
    },
};
Chart.defaults.global.tooltips.callbacks.label = function (tooltipItem, data) {
    var value = data.datasets[0].data[tooltipItem.index];
    return numberFormat(value);
};

Chart.defaults.global.animation.duration = 0;

function getSelectorEl() {
    let selectorMatch = document.getElementsByTagName("dashboard-selector");
    if (selectorMatch.length > 0) {
        return selectorMatch[0];
    } else {
        throw `connectData: tag dashboard-selector not found`;
        return;
    }
}
selector = getSelectorEl(); // very import element

allConnectedData = [];
function connectData(selector, getData) {
    Array.from(document.querySelectorAll(selector)).forEach((el) => {
        allConnectedData.push([el, getData]);
    });
}

// helper function for working with connectData
function k(...keys) {
    return (dump) => {
        return keys.map(
            (key) => dump.sites[selector.site].visits[selector.range][key]
        );
    };
}

// this one must be first
connectData("dashboard-selector", (dump) => [dump]);

connectData("dashboard-addbtn", (dump) => [dump.meta.sessionless]);

connectData("dashboard-download", (dump) => [
    dump.sites[selector.site].visits[selector.range],
    selector.site,
    selector.range,
    dump.meta.sessionless,
]);

connectData("counter-trackingcode", (dump) => [
    dump.user.uuid,
    dump.user.prefs.utcoffset || getUTCOffset(),
]);

connectData("dashboard-dynamics", (dump) => [
    dump.sites[selector.site].visits[selector.range]["date"],
    dump.user.prefs.utcoffset || getUTCOffset(),
]);

connectData("dashboard-graph", (dump) => [
    dump.sites[selector.site].visits[selector.range]["date"],
    dump.sites[selector.site].visits[selector.range]["hour"],
    dump.user.prefs.utcoffset || getUTCOffset(),
    selector.range,
]);

connectData("dashboard-settings", (dump) => [
    {
        cursite: selector.site,
        uuid: dump.user.uuid,
        meta: dump.meta,
        utcoffset: dump.user.prefs.utcoffset || getUTCOffset(),
    },
]);

connectData("dashboard-counter-visitors", (dump) => [
    dump.sites[selector.site].visits,
    selector.range,
    dump.user.prefs.utcoffset || getUTCOffset(), // getUTCOffset() is a fallback for older users
]);
connectData("dashboard-counter-search", (dump) => [
    dump.sites[selector.site].visits,
    selector.range,
    dump.user.prefs.utcoffset || getUTCOffset(),
]);
connectData("dashboard-counter-social", (dump) => [
    dump.sites[selector.site].visits,
    selector.range,
    dump.user.prefs.utcoffset || getUTCOffset(),
]);
connectData("dashboard-counter-direct", (dump) => [
    dump.sites[selector.site].visits,
    selector.range,
    dump.user.prefs.utcoffset || getUTCOffset(),
]);
connectData("#devices dashboard-pie", k("device"));
connectData("#platforms dashboard-pie ", k("platform"));
connectData("#browsers dashboard-pie", k("browser"));
connectData("dashboard-sources-countries", k("ref", "country"));
connectData("dashboard-languages", k("lang"));
connectData("dashboard-screens", k("screen"));
connectData("dashboard-pages", k("page"));
connectData("dashboard-visits", (dump) => [dump.sites[selector.site].logs]);
connectData("dashboard-hour", k("hour"));
connectData("dashboard-week", k("weekday"));
connectData("dashboard-time", k("hour"));
connectData("dashboard-share-account", (dump) => [dump.user, dump.meta]);

document.addEventListener("push-dump", (evt) => {
    if (Object.keys(evt.detail.sites).length === 0) {
        window.location.href = "setup.html";
    }
});

document.addEventListener("push-dump", (evt) => {
    var dump = evt.detail;
    patchDump(dump)
    document.dispatchEvent(new CustomEvent("redraw", { detail: dump }));
});

document.addEventListener("push-archive", (evt) => {
    window.state.archives = evt.detail;
});

document.addEventListener("push-nouser", () => {
    window.location.href = "welcome.html";
});


document.addEventListener("push-oldest-archive-date", (evt) => {
    customElements.whenDefined("dashboard-daterangeselector").then((el) => {
        let drs = document.getElementsByTagName(
            "dashboard-daterangeselector"
        )[0];
        drs.draw(evt.detail || moment().format('YYYY-MM-DD'))
    })
})

function patchArchiveVisit(visit){
    if (!visit.ref) {visit.ref = {}}
    return visit

}


function patchDump(dump){
    addArchivesToDump(window.state.archives, dump);
    addDaterangeToDump(window.state.daterange || {}, dump)

}

function addArchivesToDump(archives, dump) {
    for (const site of Object.keys(dump.sites)) {

        dump.sites[site].visits.last7 =  patchArchiveVisit(mergeVisits([
            dump.sites[site].visits.day,
            dump.sites[site].visits.yesterday,
            archives["-7:-2"][site] || {},
        ]));

        dump.sites[site].visits.last30 = patchArchiveVisit(mergeVisits([
            dump.sites[site].visits.day,
            dump.sites[site].visits.yesterday,
            archives["-30:-2"][site] || {},
        ]));

    }
    return dump
}


function addDaterangeToDump(daterange, dump) {
    for (const site of Object.keys(dump.sites)){
        let siteData = daterange[site]
        let nildata = Object.fromEntries(Object.keys(dump.sites[site].visits.all).map((k)=>[k, {}]))
        if (siteData){
            dump.sites[site].visits.daterange = {...nildata, ...siteData}
        } else {
            dump.sites[site].visits.daterange = nildata
        }
    }
}

function mergeVisits(visits) {
    let merged = {};
    for (const visit of visits) {
        for (const [dimension, typesWithCount] of Object.entries(visit)) {
            for (const [type, count] of Object.entries(typesWithCount)) {
                if (!(dimension in merged)) {
                    merged[dimension] = {};
                }
                if (!(type in merged[dimension])) {
                    merged[dimension][type] = 0;
                }
                merged[dimension][type] += count;
            }
        }
    }
    return merged;
}

function drawComponents() {
    var source = dispatchPushEvents(getDumpURL());

    customElements.whenDefined("dashboard-connstatus").then((el) => {
        let connstatus = document.getElementsByTagName(
            "dashboard-connstatus"
        )[0];
        connstatus.message("Connecting...");
        source.onopen = () => connstatus.message("Live");
        source.onerror = (err) => connstatus.message("Disconnected");
    });
}

document.addEventListener("redraw", (evt) => {
    let dump = evt.detail;
    console.log("redraw", dump);
    allConnectedData.forEach(([el, getData]) => {
        if (customElements.get(el.localName)) {
            el.draw(...getData(dump));
        } else {
            customElements
                .whenDefined(el.localName)
                .then(() => el.draw(...getData(dump)));
        }
    });
});

function getDumpURL() {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    params.set("utcoffset", getUTCOffset());
    return "/dump?" + params.toString();
}

customElements.whenDefined(selector.localName).then(() => {
    customElements.upgrade(selector);
    drawComponents();
});

// not used currently
function flash(msg) {
    document.getElementsByTagName("base-flash")[0].flash(msg);
}

function numberFormat(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function percentRepr(value, total) {
    var percentRepr = Math.round((value / total) * 100) + "%";
    if (percentRepr === "0%") {
        percentRepr = "<1%";
    }
    return percentRepr;
}

function dGroupData(entries, cutAt) {
    var entrs = Object.entries(entries);
    entrs = entrs.sort((a, b) => b[1] - a[1]);
    var top = entrs.slice(0, cutAt);
    var bottom = entrs.slice(cutAt);

    otherVal = 0;
    bottom.forEach((el) => (otherVal += el[1]));
    if (otherVal) {
        top.push(["Other", otherVal]);
    }

    var res = Object.fromEntries(top);
    if ("Unknown" in res) {
        res["Other"] = (res["Other"] || 0) + res["Unknown"];
        delete res["Unknown"];
    }
    return res;
}

function getUTCNow(utcoffset) {
    return moment().add(parseInt(utcoffset), "hours").toDate();
}

function dFillDatesToNow(myDates, utcoffset) {
    // Hack, sort the keys in the object
    dates = Object.keys(myDates)
        .sort()
        .reduce(function (acc, key) {
            acc[key] = myDates[key];
            return acc;
        }, {});

    var daysRange = (s, e) => {
        var s = new Date(s);
        var e = new Date(e);
        var o = {};
        for (var a = [], d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            o[new Date(d).toISOString().substring(0, 10)] = 0;
        }
        return o;
    };

    var sortedAvailableDates = Object.keys(dates).sort((a, b) => {
        return a > b;
    });

    return {
        ...daysRange(sortedAvailableDates[0], getUTCNow(utcoffset)),
        ...dates,
    };
}

function dGroupDates(dates) {
    let allMonths = Object.entries(dates).reduce((acc, val) => {
        let group = moment(val[0]).format("MMMM YYYY");
        acc.add(group);
        return acc;
    }, new Set());

    let groupedByMonth = Object.entries(dates).reduce((acc, val) => {
        let group;
        if (allMonths.size <= 12) {
            group = moment(val[0]).format("MMMM");
        } else {
            group = moment(val[0]).format("MMM YYYY");
        }
        acc[group] = (acc[group] || 0) + val[1];
        return acc;
    }, {});

    let groupedByWeek = Object.entries(dates).reduce((acc, val) => {
        let group = moment(val[0]).format("[CW]w");
        acc[group] = (acc[group] || 0) + val[1];
        return acc;
    }, {});

    var groupedDates = dates;
    if (Object.keys(groupedDates).length > 31) {
        groupedDates = groupedByWeek;
        // if it's still to big, use months. 16 is a magic number to swap to the per month view
        if (Object.keys(groupedDates).length > 16) {
            groupedDates = groupedByMonth;
        }
    }

    return [Object.keys(groupedDates), Object.values(groupedDates)];
}

HOUR_AM_PM = {
    0: "12 a.m.",
    1: "1 a.m.",
    2: "2 a.m.",
    3: "3 a.m.",
    4: "4 a.m.",
    5: "5 a.m.",
    6: "6 a.m.",
    7: "7 a.m.",
    8: "8 a.m.",
    9: "9 a.m.",
    10: "10 a.m.",
    11: "11 a.m.",
    12: "12 noon",
    13: "1 p.m.",
    14: "2 p.m.",
    15: "3 p.m.",
    16: "4 p.m.",
    17: "5 p.m.",
    18: "6 p.m.",
    19: "7 p.m.",
    20: "8 p.m.",
    21: "9 p.m.",
    22: "10 p.m.",
    23: "11 p.m.",
};

function dGetNormalizedHours(hours) {
    let pad = Object.fromEntries(
        [...Array(24).keys()].map((i) => [HOUR_AM_PM[i], 0])
    );
    let formatedHours = Object.fromEntries(
        Object.entries(hours).map((i) => [HOUR_AM_PM[i[0]], i[1]])
    );
    return {
        ...pad,
        ...formatedHours,
    };
}

whenReady('base-navbar', (el)=>{
    el.loggedInUserCallback((userDump) => {
        // user loaded
        var daysTracked = Math.max(...Object.values(userDump.sites).map((i)=>Object.keys(i.visits.all.date).length))
        if (daysTracked > 90 && sessionStorage.getItem('pwyw') === null && (!userDump.user.isSubscribed)){
            whenReady('base-pwyw', (el)=>el.modal())
            sessionStorage.setItem('pwyw', '1')
        }
    }, () => {})
})
