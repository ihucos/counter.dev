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
		ctx.ReturnUser()

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
		ctx.ReturnUser()

	case *models.ErrCreate:
		ctx.ReturnBadRequest(err.Error())

	default:
		ctx.ReturnInternalError(err)
	}
}

func (ctx Ctx) handleSetPrefRange() {
	user := ctx.ForceUser()
	defer user.Close()
	err := user.SetPref("range", ctx.r.URL.RawQuery)
	ctx.CatchError(err)

}

func (ctx Ctx) handleSetPrefSite() {
	user := ctx.ForceUser()
	defer user.Close()
	err := user.SetPref("site", ctx.r.URL.RawQuery)
	ctx.CatchError(err)

}

type PingDataResp struct {
	Visits    models.TimedVisits `json:"visits"`
	Logs      models.LogData     `json:"logs"`
	SiteLinks map[string]int     `json:"site_links"`
}

func (ctx Ctx) handlePing() {
	siteId := ctx.r.URL.RawQuery
	if siteId == "" {
		ctx.ReturnBadRequest("no siteId given as raw query param")
	}
	user := ctx.ForceUser()
	defer user.Close()
	visits := user.NewSite(siteId)
	timedVisits, err := visits.GetVisits(ctx.ParseUTCOffset("utcoffset"))
	ctx.CatchError(err)
	logs, err := visits.GetLogs()
	ctx.CatchError(err)
	siteLinks, err := user.GetSiteLinks()
	ctx.CatchError(err)
	resp := PingDataResp{Visits: timedVisits, Logs: logs, SiteLinks: siteLinks}
	ctx.ReturnJSON(resp, 200)
}

func (ctx Ctx) handleUser() {
	ctx.ReturnUser()
}
