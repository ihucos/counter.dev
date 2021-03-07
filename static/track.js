if (!sessionStorage.getItem("_swa") && document.referrer.indexOf(location.protocol + "//" + location.host) !== 0) {
    fetch("https://counter.dev/track?" + new URLSearchParams({
        referrer: document.referrer,
        screen: screen.width + "x" + screen.height,
        user: "counter",
        utcoffset: "1"
    }))
};
sessionStorage.setItem("_swa", "1");
