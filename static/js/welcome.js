$(document).ready(function () {
    let active = window.location.href.endsWith("?sign-up") ? 2 : 1;
    $(".tabs").tabslet({
        active: active,
    });
});

simpleForm("#sign-in form", "/dashboard.html");
simpleForm("#sign-up form", "/setup.html");

document.addEventListener("userloaded", () => {
    window.location.href = "dashboard.html";
});
