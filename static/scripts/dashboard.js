$.getJSON('/user', r => {
    var source = new EventSource("/dump");
    source.onmessage = (event) => {
        let dump = JSON.parse(event.data);
	console.log(dump)
	draw(dump)
    };
}).fail(r => {
    if (r.status === 403) {
        window.location.href = 'welcome.html'
    } else {
        alert(r.responseText)
    }
})


function connectData(tag, getData) {
  document.addEventListener("redraw", () => {
    var site = getSelector().site;
    var range = getSelector().range;
    var data;
    if (getData.length <= 1) data = getData(state.dump);
    else if (site === "" || range === "") {
      data = null;
    } else {
      data = getData(state.dump, site, range);
    }
    if (data !== null) {
      Array.from(document.getElementsByTagName(tag)).forEach((el) => {
        customElements.upgrade(el);
        el.draw(...data);
      });
    }
  });
};

function k(...keys) {
    return (dump, cursite, curtime) =>
      keys.map((key) => dump.sites[cursite].visits[curtime][key]);
};

connectData("comp-chart-alldays", (dump, cursite) => [
  dump.sites[cursite].visits.all.date,
]);
connectData("comp-chart-lastdays", (dump, cursite) => [
  dump.sites[cursite].visits.all.date,
]);
connectData("comp-chart-browser", k("browser"));
connectData("comp-chart-platform", k("platform"));
connectData("comp-chart-referrers", k("ref", "date"));
connectData("comp-chart-device", k("device"));
connectData("comp-chart-hour", k("hour"));
