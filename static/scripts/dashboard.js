
Chart.defaults.global.tooltips = {...Chart.defaults.global.tooltips, ...{
                        enabled: true,
                        mode: "index",
                        borderWidth: 1,
                        cornerRadius: 2,
                        xPadding: 8,
                        yPadding: 12,
                        backgroundColor: '#ffffff',
                        borderColor: '#121212',

                        titleFontSize: 12,
                        titleFontFamily: 'Nunito Sans',
                        titleFontColor: '#121212',

                        bodyFontSize: 12,
                        bodyFontFamily: 'Nunito Sans',
                        bodyFontColor: '#121212',
                        displayColors: false,
                    }}


$.getJSON('/user', r => {
    var source = new EventSource("/dump");
    source.onmessage = (event) => {
        let dump = JSON.parse(event.data);
	console.log(dump)
	document.dispatchEvent(new CustomEvent('redraw', {detail: dump}))
    };
}).fail(r => {
    if (r.status === 403) {
        window.location.href = 'welcome.html'
    } else {
        alert(r.responseText)
    }
})


function connectData(tag, getData) {
  document.addEventListener("redraw", (evt) => {
    var dump = evt.detail

    // ensure the selector is initialized
    let selector = document.getElementsByTagName("comp-newdesign-selector")[0];
    customElements.upgrade(selector)

    var site = selector.site;
    var range = selector.range;

    var data;
    if (getData.length <= 1) {
      data = getData(dump)
    } else if (site === "" || range === "") {
      data = null;
    } else {
      data = getData(dump, site, range);
    }
    if (data !== null) {
      Array.from(document.querySelectorAll(tag)).forEach((el) => {
        customElements.upgrade(el);
        el.draw(...data);
      });
    }
  });
};


// helper function for working with connectData
function k(...keys) {
    return (dump, cursite, curtime) =>
      keys.map((key) => dump.sites[cursite].visits[curtime][key]);
};

// selector must be initialized as first!
connectData("comp-newdesign-selector", (dump) => [dump]);

connectData("comp-newdesign-counter-visitors", (dump, cursite, curtime) => [dump.sites[cursite].visits, curtime]);
connectData("comp-newdesign-counter-search", (dump, cursite, curtime) => [dump.sites[cursite].visits, curtime]);
connectData("comp-newdesign-counter-social", (dump, cursite, curtime) => [dump.sites[cursite].visits, curtime]);
connectData("comp-newdesign-counter-direct", (dump, cursite, curtime) => [dump.sites[cursite].visits, curtime]);

connectData("comp-newdesign-graph", k("date"));
connectData("comp-newdesign-dynamics", k("date"));

connectData("#devices comp-newdesign-pie", k("device"));
connectData("#platforms comp-newdesign-pie", k("platform"));
connectData("#browsers comp-newdesign-pie", k("browser"));

connectData("#devices comp-newdesign-pielegend", k("device"));
connectData("#platforms comp-newdesign-pielegend", k("platform"));
connectData("#browsers comp-newdesign-pielegend", k("browser"));

connectData("comp-newdesign-sources-countries[type=sources]", k("ref"));
connectData("comp-newdesign-sources-countries[type=countries]", k("country"));

connectData("comp-newdesign-languages", k("lang"));
connectData("comp-newdesign-screens", k("screen"));

connectData("comp-newdesign-pages", k("loc"));
connectData("comp-newdesign-visits", (dump, cursite) => [dump.sites[cursite].logs, ]);

connectData("comp-newdesign-time-graph", k("hour"));
connectData("comp-newdesign-hour", k("hour"));
connectData("comp-newdesign-week-graph", k("weekday"));

connectData("comp-newdesign-time", k("hour"));




//
// connectData("comp-chart-lastdays", (dump, cursite) => [
//   dump.sites[cursite].visits.all.date,
// ]);
// connectData("comp-chart-browser", k("browser"));
// connectData("comp-chart-platform", k("platform"));
// connectData("comp-chart-referrers", k("ref", "date"));
// connectData("comp-chart-device", k("device"));
// connectData("comp-chart-hour", k("hour"));
