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
		prefMail, err := user.GetPref("mail")
		if err != nil {
			ctx.CatchError(err)
		}
		if mail == prefMail {
			ctx.LogEvent("recovery")

			ctx.NoAutoCleanup()
			go func(){
				defer ctx.RunCleanup()
				err = user.PasswordRecovery(ctx.App.Config.MailgunSecretApiKey)
				if err != nil {
					ctx.App.Logger.Printf("password recovery: %s\n", err)
				}
			}()
		}

	})
}
