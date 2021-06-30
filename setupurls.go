package main;

func setupUrls(app *App){
	app.Connect("/login", func (ctx *Ctx) {
		userId := ctx.r.FormValue("user")
		passwordInput := ctx.r.FormValue("password")
		if userId == "" {
			ctx.ReturnBadRequest("Missing Input: user")
		}
		if passwordInput == "" {
			ctx.ReturnBadRequest("Missing Input: password")
		}

		user := ctx.User(userId)

		passwordOk, err := user.VerifyPassword(passwordInput)
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
