
$(document).ready(function () {
    let active = window.location.href.endsWith("?sign-up") ? 2 : 1;
    $(".tabs").tabslet({
        active: active,
    });
});

simpleForm('#sign-in form', '/new/dashboard.html')
simpleForm('#sign-up form', '/new/setup.html')
