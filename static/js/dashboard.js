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
Chart.defaults.global.tooltips.callbacks.label = function(tooltipItem, data) {
    var value = data.datasets[0].data[tooltipItem.index];
    return kFormat(value)
}

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
    dump.user.id,
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
        userId: dump.user.id,
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
connectData("dashboard-pages", k("loc"));
connectData("dashboard-visits", (dump) => [dump.sites[selector.site].logs]);
connectData("dashboard-hour", k("hour"));
connectData("dashboard-week", k("weekday"));
connectData("dashboard-time", k("hour"));
connectData("dashboard-share-account", (dump) => [dump.user, dump.meta]);

function drawComponents(url) {
    var source = new EventSource(url);
    customElements.whenDefined("dashboard-connstatus").then((el) => {
        let connstatus = document.getElementsByTagName(
            "dashboard-connstatus"
        )[0];
        connstatus.message("Connecting...");
        source.onopen = () => connstatus.message("Live");
        source.onerror = (err) => connstatus.message("Disconnected");
    });
    source.onmessage = (event) => {
        let dump = JSON.parse(event.data);

        if (!dump) {
            window.location.href = "welcome.html";
            return;
        }

        if (Object.keys(dump.sites).length === 0) {
            window.location.href = "setup.html";
        }

        document.dispatchEvent(new CustomEvent("redraw", { detail: dump }));

        //document.getElementsByTagName("body")[0].style.display = "block";
    };
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
    drawComponents(getDumpURL());
});

// not used currently
function flash(msg) {
    document.getElementsByTagName("base-flash")[0].flash(msg);
}

function kFormat(num) {
    switch (num.toString().length){
        case 1:
            return num
        case 2:
            return num
        case 3:
            return num
        case 4:
            return ''+numberFormat(Math.round(num/100) * 100)
        case 5:
            return numberFormat(Math.round(num/1000) * 1000)
        case 6:
            return numberFormat(Math.round(num/10000) * 10000)
        case 7:
            return numberFormat(Math.round(num/100000) * 100000)
        case 8:
            return numberFormat(Math.round(num/1000000) * 1000000)
        case 9:
            return numberFormat(Math.round(num/10000000) * 10000000)
        default:
            return numberFormat(num)
    }
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

function dPadDates(dates, utcoffset) {
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

function dNormalizedDates(dates, utcoffset) {
    let groupedByDay = dPadDates(dates, utcoffset);

    let allMonths = Object.entries(groupedByDay).reduce((acc, val) => {
        let group = moment(val[0]).format("MMMM YYYY");
        acc.add(group)
        return acc;
    }, new Set());

    let groupedByMonth = Object.entries(groupedByDay).reduce((acc, val) => {
        let group
        if ((allMonths.size) <= 12) {
            group = moment(val[0]).format("MMMM");
        } else {
            group = moment(val[0]).format("MMM YYYY");
        }
        acc[group] = (acc[group] || 0) + val[1];
        return acc;
    }, {});

    let groupedByWeek = Object.entries(groupedByDay).reduce((acc, val) => {
        let group = moment(val[0]).format("[CW]w");
        acc[group] = (acc[group] || 0) + val[1];
        return acc;
    }, {});

    var groupedDates = groupedByDay;
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
