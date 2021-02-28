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
    var user = $("#sign-in .user-input").val()
    var password = $("#sign-in .password-input").val()
    login(user, password)
        .then((msg) => {
            window.location.href = "/dashboard";
        })
        .catch(alert);
    evt.preventDefault();
});

$("#sign-up form").submit((evt) => {
    var user = $("#sign-up .user-input").val()
    var password = $("#sign-up .password-input").val()
    register(user, password)
        .then((msg) => {
            window.location.href = "/dashboard";
        })
        .catch(alert);
    evt.preventDefault();
});

$(document).ready(function () {
    let active = window.location.href.endsWith("?sign-up") ? 2 : 1;
    $(".tabs").tabslet({
        active: active,
    });
});
