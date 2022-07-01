var source = new EventSource(API_SERVER + "/dump", {withCredentials: true});
source.onmessage = (event) => {
    let dump = JSON.parse(event.data);
    console.log(dump);
    drawTrackingcode(dump);
    if (!dump) {
        window.location.href = "index.html";
    }
    if (Object.keys(dump.sites).length > 0) {
        window.location.href = "dashboard.html";
    }
};

function drawTrackingcode(dump) {
    customElements.whenDefined("counter-trackingcode").then(() => {
        let el = document.querySelector("counter-trackingcode");
        el.draw(dump.user.id, dump.user.prefs.utcoffset || getUTCOffset());
    });
}
