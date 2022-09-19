package endpoints

import (
	"net/http"

	"github.com/ihucos/counter.dev/lib"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		ctx.CheckMethod("POST")
		confirmUser := ctx.R.FormValue("confirmUser")
		user := ctx.ForceUser()
		if user.Id != confirmUser {
			ctx.ReturnBadRequest("Confirmation failed")
		}
		ctx.Logout()
		user.DelAllSites()
		user.Disable()
		http.Redirect(ctx.W, ctx.R, "/", http.StatusTemporaryRedirect)
	})
}
