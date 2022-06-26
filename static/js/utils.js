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

if location.host == 'staging.counter.dev' {
    API_SERVER = 'counter.dev'
} else {
    API_SERVER = location.host
}
