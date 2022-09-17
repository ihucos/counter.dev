if (!sessionStorage.getItem("_swa") && document.referrer.indexOf(location.protocol + "//" + location.host) !== 0) {
    fetch("https://counter.dev/track?" + new URLSearchParams({
        referrer: document.referrer,
        screen: screen.width + "x" + screen.height,
        id: "6f0d1527-8dfa-4ead-9e9d-1ab2334c391d",
        utcoffset: "2"
    }))
};
sessionStorage.setItem("_swa", "1");
