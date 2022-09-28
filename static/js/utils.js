function simpleForm(formSelector, arg) {
    var success;
    if (typeof arg === "function") {
        success = arg;
    } else {
        success = function (response) {
            window.location.href = arg;
        };
    }
    document.querySelector(formSelector).onsubmit = (evt) => {
        var el = evt.target;
        $.ajax({
            type: el.getAttribute("method") || "POST",
            url: el.getAttribute("action"),
            data: $(el).serialize(),
            success: success,
            error: function (request, status, error) {
                alert(request.responseText);
            },
        });
        return false;
    };
}

function getUTCOffset() {
    return Math.round((-1 * new Date().getTimezoneOffset()) / 60);
}

function escapeHtml(unsafe) {
    return (unsafe + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function dispatchPushEvents(url, event_prefix) {
    var prefix = event_prefix || "push-";
    var source = new EventSource(url);
    source.onmessage = (event) => {
        let serverData = JSON.parse(event.data);
        document.dispatchEvent(
            new CustomEvent(prefix + serverData.type, {
                detail: serverData.payload,
            })
        );
    };
    return source;
}

document.write(`
<script src="https://cdn.counter.dev/script-testing.js"
  data-id="33671ad4-a966-4a52-b48f-56c92d10a678"
  data-utcoffset="1"
  data-server="https://simple-web-analytics.com">
</script>`);
