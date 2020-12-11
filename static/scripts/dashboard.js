
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
      Array.from(document.getElementsByTagName(tag)).forEach((el) => {
        customElements.upgrade(el);
        el.draw(...data);
      });
    }
  });
};


connectData("comp-newdesign-selector", (dump) => [Object.keys(dump.sites), dump.user.prefs.site, dump.user.prefs.range]);

function k(...keys) {
    return (dump, cursite, curtime) =>
      keys.map((key) => dump.sites[cursite].visits[curtime][key]);
};

//connectData("comp-chart-alldays", (dump, cursite) => [
//  dump.sites[cursite].visits.all.date,
//]);
// connectData("comp-chart-lastdays", (dump, cursite) => [
//   dump.sites[cursite].visits.all.date,
// ]);
// connectData("comp-chart-browser", k("browser"));
// connectData("comp-chart-platform", k("platform"));
// connectData("comp-chart-referrers", k("ref", "date"));
// connectData("comp-chart-device", k("device"));
// connectData("comp-chart-hour", k("hour"));
