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
    return Math.abs(num) > 999 ?
        Math.sign(num) * (Math.abs(num) / 1000).toFixed(1) + "K" :
        Math.sign(num) * Math.abs(num) + "";
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


function dNormalizedDates(dates) {

    var getUTCMinusElevenNow = () => {
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

    var groupedByDay = {
        ...daysRange(sortedAvailableDates[0], getUTCMinusElevenNow()),
        ...dates
    }

    let groupedByMonth = Object.entries(groupedByDay).reduce((acc, val) => {
        let group = moment(val[0]).format('MMMM');
        acc[group] = (acc[group] || 0) + val[1];
        return acc
    }, {})

    let groupedByWeek = Object.entries(groupedByDay).reduce((acc, val) => {
        let group = moment(val[0]).format('[CW]w');
        acc[group] = (acc[group] || 0) + val[1];
        return acc
    }, {})

    var groupedDates = groupedByDay
    if (Object.keys(groupedDates).length > 31) {
        groupedDates = groupedByWeek
        // if it's still to big, use months. 16 is a magic number to swap to the per month view
        if (Object.keys(groupedDates).length > 16) {
            groupedDates = groupedByMonth
        }
    }

    return [Object.keys(groupedDates), Object.values(groupedDates)]
}
