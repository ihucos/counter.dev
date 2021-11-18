function simpleForm(formSelector, arg) {
    var success
    if (typeof arg === "function") {
        success = arg
    } else {
        success = function (response) {
            window.location.href = redirectUrl;
        }
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
