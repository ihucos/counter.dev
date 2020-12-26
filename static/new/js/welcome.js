function login(user, password) {
    return new Promise((success, fail) => {
        $.post("/login", {
            user: user,
            password: password,
        })
            .done((r) => success($.parseJSON(r)))
            .fail((r) => fail(r.responseText));
    });
}

function register(user, password) {
    return new Promise((success, fail) => {
        $.post("/register", {
            user: user,
            password: password,
        })
            .done((r) => success($.parseJSON(r)))
            .fail((r) => fail(r.responseText));
    });
}

$("#sign-in form").submit((evt) => {
    login($("#sign-in-user").val(), $("#sign-in-password").val())
        .then((msg) => {
            window.location.href = "dashboard.html";
        })
        .catch(alert);
    evt.preventDefault();
});

$("#sign-up form").submit((evt) => {
    register($("#sign-up-user").val(), $("#sign-up-password").val())
        .then((msg) => {
            window.location.href = "dashboard.html";
        })
        .catch(alert);
    evt.preventDefault();
});

$(document).ready(function () {
    let active = window.location.hash === "#sign-up" ? 2 : 1;
    $(".tabs").tabslet({
        active: active,
    });
});
