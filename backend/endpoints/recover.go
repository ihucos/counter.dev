package endpoints

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		userId := ctx.R.FormValue("user")
		mail := ctx.R.FormValue("mail")
		if userId == "" {
			ctx.ReturnBadRequest("Missing Input: user")
		}
		if mail == "" {
			ctx.ReturnBadRequest("Missing Input: Email")
		}

		user := ctx.User(userId)
		prefMail, err := ctx.ForceUser().GetPref("mail")
		if err != nil {
			ctx.CatchError(err)
		}
		if mail == prefMail {
			ctx.LogEvent("recovery")
			user.PasswordRecovery()
		}

	})
}
