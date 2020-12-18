
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


//function getSelector() {
//  let selector = document.getElementsByTagName("comp-selector")[0];
//  customElements.upgrade(selector);
//  return selector;
//}



// document.addEventListener("redraw-selector", () => {
//   getSelector().draw(
//     Object.keys(state.dump.sites),
//     state.dump.user.prefs.site,
//     state.dump.user.prefs.range
//   );
// });


function connectData(tag, getData) {
  document.addEventListener("redraw", (evt) => {
    var dump = evt.detail

    // ensure the selector is initialized
    let selector = document.getElementsByTagName("comp-newdesign-selector")[0];
    customElements.upgrade(selector)

    var site = selector.site;
    var range = selector.range;

    var data;
    if (getData.length <= 1) data = getData(dump);
    else if (site === "" || range === "") {
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

connectData("comp-newdesign-selector", (dump) => [dump]);

connectData("comp-newdesign-graph", (dump, cursite, curtime) => [
  dump.sites[cursite].visits[curtime].date,
]);

connectData("comp-newdesign-counter-visits", k("date"));
connectData("comp-newdesign-counter-direct", k("date", "ref"));
connectData("comp-newdesign-counter-search", k("ref"));
connectData("comp-newdesign-pie", k("dev"));

connectData("#devices comp-newdesign-pie", k("device"));
connectData("#platforms comp-newdesign-pie", k("platform"));
connectData("#browsers comp-newdesign-pie", k("browser"));

connectData("#devices comp-newdesign-pielegend", k("device"));
connectData("#platforms comp-newdesign-pielegend", k("platform"));
connectData("#browsers comp-newdesign-pielegend", k("browser"));


connectData("comp-newdesign-sources", k("ref"));
connectData("comp-newdesign-countries", k("country"));


//
// connectData("comp-chart-lastdays", (dump, cursite) => [
//   dump.sites[cursite].visits.all.date,
// ]);
// connectData("comp-chart-browser", k("browser"));
// connectData("comp-chart-platform", k("platform"));
// connectData("comp-chart-referrers", k("ref", "date"));
// connectData("comp-chart-device", k("device"));
// connectData("comp-chart-hour", k("hour"));
