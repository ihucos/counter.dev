package endpoints

import (
	"net/http"

	"github.com/ihucos/counter.dev/lib"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		ctx.Logout()
		next := ctx.R.FormValue("next")
		var redirectURL string
		if next == "login" {
			redirectURL = "/welcome.html?sign-in"
		} else {
			redirectURL = "/"
		}
		http.Redirect(ctx.W, ctx.R, redirectURL, http.StatusTemporaryRedirect)
	})
}
