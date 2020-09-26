package main

import (
	"./models"
	"net/http"

)

func (ctx Ctx) handleLogin() {
	userId := ctx.r.FormValue("user")
	passwordInput := ctx.r.FormValue("password")
	if userId == "" || passwordInput == "" {
		ctx.ReturnBadRequest("Missing Input")
	}

	user := ctx.app.OpenUser(userId)
	defer user.Close()

	passwordOk, err := user.VerifyPassword(passwordInput)
	ctx.CatchError(err)
	tokenOk, err := user.VerifyToken(passwordInput)
	ctx.CatchError(err)

	if passwordOk || tokenOk {
		if passwordOk {
			user.TouchAccess()
		}
		ctx.SetSessionUser(userId)
		ctx.Return("OK", 200)

	} else {
		ctx.ReturnBadRequest("Wrong username or password")
	}
}

func (ctx Ctx) handleLogout() {
	ctx.Logout()
	http.Redirect(ctx.w, ctx.r, "/app", http.StatusTemporaryRedirect)
}

func (ctx Ctx) handleRegister() {
	userId := ctx.r.FormValue("user")
	password := ctx.r.FormValue("password")
	if userId == "" || password == "" {
		ctx.ReturnBadRequest("Missing Input")
	}

	user := ctx.app.OpenUser(userId)
	defer user.Close()

	err := user.Create(password)
	switch err.(type) {
	case nil:
		ctx.SetSessionUser(userId)
		ctx.Return("OK", 200)

	case *models.ErrCreate:
		ctx.ReturnBadRequest(err.Error())

	default:
		ctx.ReturnInternalError(err)
	}
}

func (ctx Ctx) handleData() {
	ctx.ReturnUserData(ctx.ForceUserId())
}

func (ctx Ctx) handleSetPrefRange() {
	user := ctx.ForceUser()
	defer user.Close()
	err := user.SetPref("range", ctx.r.URL.RawQuery)
	ctx.CatchError(err)

}
