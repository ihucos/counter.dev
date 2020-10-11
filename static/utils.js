
function tagName() {
    var tagName = new URL(document.currentScript.src).pathname
        .slice(1, -3)
        .replaceAll('/', '-');
    return tagName
}

function emptyIfSumZero(arr) {
    if (arr.reduce((pv, cv) => pv + cv, 0) === 0) {
        return []
    }
    return arr
}

function escapeHtml(unsafe) {
    return (unsafe + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

function sum(array) {
    return array.reduce((acc, next) => acc + next, 0)

}

function getUTCOffset() {
    return Math.round(-1 * new Date().getTimezoneOffset() / 60)
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




function dGetNormalizedDateData(dates) {

    var daysRange = function(s, e) {
        var s = new Date(s)
        var e = new Date(e)
        var o = {}
        for (var a = [], d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
            o[new Date(d).toISOString().substring(0, 10)] = 0;
        }
        return o;
    };

    var keys = Object.keys(dates)
    keys.sort((a, b) => {
        return a > b;
    });


    var calc_min = getUTCMinusElevenNow()
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


    var max = getUTCMinusElevenNow().toISOString().substring(0, 10)
    var date_data = {
        ...daysRange(min, max),
        ...dates
    }

    return splitObject(date_data, true)
}

function dGroupData(entries, cutAt) {
    var entrs = Object.entries(entries)
    entrs = entrs.sort((a, b) => b[1] - a[1])
    var top = entrs.slice(0, cutAt)
    var bottom = entrs.slice(cutAt)

    otherVal = 0
    bottom.forEach(el => otherVal += el[1])
    if (otherVal) {
        top.push(["Other", otherVal])
    }

    var res = Object.fromEntries(top)
    if ("Unknown" in res) {
        res["Other"] = (res["Other"] || 0) + res["Unknown"]
        delete res["Unknown"]
    }
    return res
}




//setTimeout(() => { }, 500) // yeahh.. we need to all web components defintions to load ....


class StateMngr {
        _ready = new Set([]);
        _dump = null

        customElementsReady(){ // this is the starting point
                this._ready.add('custom-elements')
        	this._requestSetup("dump-loader")
        }

	dumpLoaderReady(){
            this._ready.add('dump-loader')
        }

	redrawingReady(){
            this._ready.add('redrawing')
        }

        selectorReady(){
            this._ready.add('selector')
            this._requestSetup("redrawing")
        }

        dumpAvailable(dump){
            this._dump = dump
            if (!this._ready.has("dump")){
            	this._requestSetup("selector")
            }
            this._ready.add("dump")
            document.dispatchEvent(new Event("redraw"));
        }

        getDump(){
            if (this._dump === null){
            	throw "dump not available (yet?)"
            }
            return this._dump
        }

        _requestSetup(name){
        	document.dispatchEvent(new Event("setup-" + name));
                if (!this._ready.has(name)){
                        throw(`StateMngr: unsucessfully requested to setup: ${name}`)
                }
        }

        rangeSelChanged(){
            document.dispatchEvent(new Event("redraw"));
        }

        siteSelChanged(){
            document.dispatchEvent(new Event("redraw"));
        }
}

document.addEventListener('setup-dump-loader', () => {
    var source = new EventSource("/dump");
    source.onmessage = event => {
        let dump = JSON.parse(event.data)
        state.dumpAvailable(dump)
    };
    state.dumpLoaderReady()
})

document.addEventListener('setup-selector', () => {
	let el = document.getElementsByTagName('comp-selector')[0]
        customElements.upgrade(el)
        el.draw(Object.keys(state.getDump().sites), state.getDump().user.prefs)
        state.selectorReady()
})



document.addEventListener('setup-redrawing', () => {


        var connectData = (tag, getData) => {
            document.addEventListener("redraw", () => {
                var data = getData(state.getDump(), getSelectedSite(), getSelectedTimeRange())
                Array.from(document.getElementsByTagName(tag)).map(el => {
                    customElements.upgrade(el)
                    el.draw(...data)
                })
        
            })
        }
        
        var k = (...keys) => {
            return (dump, cursite, curtime) => keys.map(
            	key => dump.sites[cursite].visits[curtime][key])
        }


        //
        // charts
        //
        connectData("comp-chart-alldays", (dump, cursite) => [dump.sites[cursite].visits.all.date])
        connectData("comp-chart-lastdays", (dump, cursite) => [dump.sites[cursite].visits.all.date])
        connectData("comp-chart-browser", k("browser"))
        connectData("comp-chart-platform", k("platform"))
        connectData("comp-chart-referrers", k("ref", "date"))
        connectData("comp-chart-device", k("device"))
        connectData("comp-chart-hour", k("hour"))
        connectData("comp-chart-time", k("hour"))
        connectData("comp-chart-weekday", k("weekday"))
        
        //
        // tables
        //
        connectData("comp-table-countries", k("country"))
        connectData("comp-table-languages", k("lang"))
        connectData("comp-table-locations", k("loc"))
        connectData("comp-table-referrals", k("ref"))
        connectData("comp-table-screens", k("screen"))
        connectData("comp-table-visits", (dump, cursite) => [dump.sites[cursite].logs])
        
        //
        // Others
        //
        connectData("comp-map", k("country"))
        connectData("comp-uservar", dump => [dump.user])
        // connect selector!

        state.redrawingReady()
})





state = new StateMngr()
setTimeout(()=> state.customElementsReady(), 500) // remove fake!

