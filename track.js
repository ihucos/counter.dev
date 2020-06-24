





<script>
// Simple Web Analytics tracking code.
(function() {
    var selfRef = document.referrer && document.referrer.indexOf(location.protocol + "//" + location.host)
    if (!selfRef && !sessionStorage.getItem("_swa")) {
        fetch("https://simple-web-analytics.com/track?" + new URLSearchParams({
            referrer: document.referrer,
            site: "simple-web-analytics.com",
            utcoffset: 2
        }));
        sessionStorage.setItem("_swa", "1");
    }
})()
</script>



(document.referrer || location.href).indexOf(location.protocol + "//" + location.host)



<script>
// Simple Web Analytics tracking code.
if (!sessionStorage.getItem("_swa") && document.referrer.indexOf(location.protocol + "//" + location.host) !== 0) {
    fetch("https://simple-web-analytics.com/track?" + new URLSearchParams({
        referrer: document.referrer,
        site: "simple-web-analytics.com",
        utcoffset: 2
    }));
}
sessionStorage.setItem("_swa", "1");
</script>
