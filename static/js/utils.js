function simpleForm(formSelector, action) {
    document.querySelector(formSelector).onsubmit = (evt) => {
        var el = evt.target;
        $.ajax({
            type: el.getAttribute("method") || "POST",
            url: el.getAttribute("action"),
            data: $(el).serialize(),
            success: function (response) {
                if (action instanceof Function) {
                    window.R = response
                    action(response)
                } else {
                    window.location.href = action;
                }
            },
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

function dispatchPushEvents(url){
    var source = new EventSource(url);
    source.onmessage = (event) => {
        let serverData = JSON.parse(event.data);
        document.dispatchEvent(new CustomEvent("push-" + serverData.type,
            {detail: serverData.payload}));
    }
    return source
}

document.write(`
<script src="https://cdn.counter.dev/script.js"
  data-id="33671ad4-a966-4a52-b48f-56c92d10a678"
  data-utcoffset="1"
  data-server="https://simple-web-analytics.com">
</script>`)
