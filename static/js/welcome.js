$(document).ready(() => {
	const active = window.location.href.endsWith("?sign-up") ? 2 : 1;
	$(".tabs").tabslet({
		active: active,
	});
});

simpleForm("#sign-in form[action='/login']", "/dashboard.html");
simpleForm("#modal-recover form[action='/recover']", () => {
	$.modal.close();
	notify(
		"If the given email and username match, we will send you an email with further instructions.",
	);
});
simpleForm("#sign-up form", "/setup.html");

document.addEventListener("userloaded", () => {
	window.location.href = "dashboard.html";
});
