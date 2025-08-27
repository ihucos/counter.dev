(() => {
	if (
		sessionStorage.getItem("doNotTrack") ||
		localStorage.getItem("doNotTrack")
	) {
		return;
	}
	var id = document.currentScript.getAttribute("data-id");
	var utcoffset = document.currentScript.getAttribute("data-utcoffset");
	var timezone = document.currentScript.getAttribute("data-timezone");
	var server =
		document.currentScript.getAttribute("data-server") ||
		"https://t.counter.dev";

	if (
		!sessionStorage.getItem("_swa") &&
		!document.referrer.startsWith(`${location.protocol}//${location.host}`)
	) {
		setTimeout(() => {
			sessionStorage.setItem("_swa", "1");
			var params = new URLSearchParams({
				referrer: document.referrer,
				screen: `${screen.width}x${screen.height}`,
				id: id,
				utcoffset: utcoffset,
			});
			if (timezone) {
				params.set("timezone", timezone);
			}
			fetch(`${server}/track?${params}`);
		}, 4500);
	}
	var beaconParams = new URLSearchParams({
		id: id,
		page: window.location.pathname,
	});
	if (timezone) {
		beaconParams.set("timezone", timezone);
	}
	navigator.sendBeacon(`${server}/trackpage`, beaconParams);
})();
