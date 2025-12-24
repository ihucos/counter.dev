package endpoints

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		userId := ctx.R.FormValue("user")
		passwordInput := ctx.R.FormValue("password")
		if userId == "" {
			ctx.ReturnBadRequest("Missing Input: user")
		}
		if passwordInput == "" {
			ctx.ReturnBadRequest("Missing Input: password")
		}

		user := ctx.User(userId)

		passwordOk, err := user.VerifyPasswordOrTmpPassword(passwordInput)
		ctx.CatchError(err)

		if passwordOk {
			ctx.LogEvent("login")
			user.TouchAccess()
			ctx.SetSessionUser(userId)
			ctx.ReturnUser()

		} else {
			ctx.ReturnBadRequest("Wrong username or password")
		}
	})
}
