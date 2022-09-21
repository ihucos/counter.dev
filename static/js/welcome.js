$(document).ready(function () {
    let active = window.location.href.endsWith("?sign-up") ? 2 : 1;
    $(".tabs").tabslet({
        active: active,
    });
});

simpleForm("#sign-in form[action='/login']", "/dashboard.html");
simpleForm("#modal-recover form[action='/recover']", () => {
    $.modal.close();
    alert("hi")
});
simpleForm("#sign-up form", "/setup.html");

$("#password-recover").click( () => {
    $(".tabs").tabslet({
        active: 4,
    });
    return false
});

document.addEventListener("userloaded", () => {
    window.location.href = "dashboard.html";
});

$("#password-recover").click((el) => {
    $("form[action='/login']").hide()
    $("form[action='/recover']").show()
})

$("#password-recover").click((el) => {
    $("form[action='/login']").hide()
    $("form[action='/recover']").show()
    return false
})


$("#go-to-login").click((el) => {
    $("form[action='/recover']").hide()
    $("form[action='/login']").show()
    return false
})
