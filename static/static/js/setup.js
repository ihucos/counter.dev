document.addEventListener("push-nouser", () => {
    window.location.href = "index.html";
});

document.addEventListener("push-dump", (evt) => {
    let dump = evt.detail;
    if (Object.keys(dump.sites).length > 0) {
        window.location.href = "dashboard.html";
    }
    customElements.whenDefined("counter-trackingcode").then(() => {
        let el = document.querySelector("counter-trackingcode");
        el.draw(dump.user.uuid, dump.user.prefs.utcoffset || getUTCOffset());
    });
});

dispatchPushEvents("/dump");
