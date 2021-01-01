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

function getSelectorEl() {
    let selectorMatch = document.getElementsByTagName("dashboard-selector");
    if (selectorMatch.length > 0) {
        return selectorMatch[0];
    } else {
        throw `connectData: tag dashboard-selector not found`;
        return;
    }
}

allConnectedData = [];
function connectData(tag, getData) {
    Array.from(document.querySelectorAll(tag)).forEach((el) => {
        allConnectedData.push([el, getData]);
    });
}

document.addEventListener("redraw", (evt) => {
    let dump = evt.detail;
    let selector = getSelectorEl();
    for (var i = 0; i < allConnectedData.length; i++) {
        let el = allConnectedData[i][0];
        let getData = allConnectedData[i][1];
        let drawData = getData(dump, selector.site, selector.range);
        customElements.whenDefined(el.localName).then(() => {
            //console.log("draw", el.localName, el, drawData)
            customElements.upgrade(el);
            el.draw(...drawData);
        });
    }
});

// helper function for working with connectData
function k(...keys) {
    return (dump, cursite, curtime) =>
        keys.map((key) => dump.sites[cursite].visits[curtime][key]);
}

connectData("dashboard-counter-visitors", (dump, cursite, curtime) => [
    dump.sites[cursite].visits,
    curtime,
]);
connectData("dashboard-counter-search", (dump, cursite, curtime) => [
    dump.sites[cursite].visits,
    curtime,
]);
connectData("dashboard-counter-social", (dump, cursite, curtime) => [
    dump.sites[cursite].visits,
    curtime,
]);
connectData("dashboard-counter-direct", (dump, cursite, curtime) => [
    dump.sites[cursite].visits,
    curtime,
]);
connectData("dashboard-graph", k("date", "hour"));
connectData("dashboard-dynamics", k("date"));
connectData("#devices dashboard-pie", k("device"));
connectData("#platforms dashboard-pie ", k("platform"));
connectData("#browsers dashboard-pie", k("browser"));
connectData("dashboard-sources-countries", k("ref", "country"));
connectData("dashboard-languages", k("lang"));
connectData("dashboard-screens", k("screen"));
connectData("dashboard-pages", k("loc"));
connectData("dashboard-visits", (dump, cursite) => [dump.sites[cursite].logs]);
connectData("dashboard-hour", k("hour"));
connectData("dashboard-week", k("weekday"));
connectData("dashboard-time", k("hour"));

if (window.username === null) {
    window.location.href = "welcome.html";
} else {
    var source = new EventSource("/dump");
    source.onmessage = (event) => {
        let dump = JSON.parse(event.data);

        let selector = getSelectorEl();
        customElements.whenDefined(selector.localName).then(() => {
            customElements.upgrade(selector);
            console.log(dump);
            selector.draw(dump);
            document.dispatchEvent(new CustomEvent("redraw", { detail: dump }));
        });
    };
}

function escapeHtml(unsafe) {
    return (unsafe + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function kFormat(num) {
    num = Math.floor(num);
    return Math.abs(num) > 999
        ? Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "K"
        : Math.sign(num) * Math.abs(num) + "";
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

function getUTCMinusElevenNow() {
    var date = new Date();
    var now_utc = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    );

    let d = new Date(now_utc);
    d.setHours(d.getHours() - 11);
    return d;
}

function dPadDates(dates) {
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
        ...daysRange(sortedAvailableDates[0], getUTCMinusElevenNow()),
        ...dates,
    };
}

function dNormalizedDates(dates) {
    let groupedByDay = dPadDates(dates);

    let groupedByMonth = Object.entries(groupedByDay).reduce((acc, val) => {
        let group = moment(val[0]).format("MMMM");
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
