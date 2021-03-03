package main

import (
	"./models"
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"net/http"
	"path/filepath"
	"strings"
)

type UserDump struct {
	Id    string            `json:"id"`
	Token string            `json:"token"`
	Prefs map[string]string `json:"prefs"`
}

type SitesDumpVal struct {
	Count  int                `json:"count"`
	Logs   models.LogData     `json:"logs"`
	Visits models.TimedVisits `json:"visits"`
}

type SitesDump map[string]SitesDumpVal
type Meta map[string]string

type Dump struct {
	Sites SitesDump         `json:"sites"`
	User  UserDump          `json:"user"`
	Meta  map[string]string `json:"meta"`
}

func LoadSitesDump(user models.User, utcOffset int) (SitesDump, error) {
	sitesDump := make(SitesDump)

	sitesLink, err := user.GetSiteLinks()
	if err != nil {
		return SitesDump{}, err
	}

	for siteId, count := range sitesLink {
		site := user.NewSite(siteId)
		logs, err := site.GetLogs()
		if err != nil {
			return SitesDump{}, err
		}
		visits, err := site.GetVisits(utcOffset)
		if err != nil {
			return SitesDump{}, err
		}
		sitesDump[siteId] = SitesDumpVal{
			Logs:   logs,
			Visits: visits,
			Count:  count,
		}
	}
	return sitesDump, nil
}

func LoadDump(user models.User, utcOffset int) (Dump, error) {
	prefsData, err := user.GetPrefs()
	if err != nil {
		return Dump{}, err
	}

	token, err := user.ReadToken()
	if err != nil {
		return Dump{}, err
	}

	sitesDump, err := LoadSitesDump(user, utcOffset)
	if err != nil {
		return Dump{}, err
	}

	userDump := UserDump{Id: user.Id, Token: token, Prefs: prefsData}
	return Dump{User: userDump, Sites: sitesDump, Meta: Meta{}}, nil
}

func (ctx *Ctx) handleLogin() {
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
	tokenOk, err := user.VerifyToken(passwordInput) // XXXXXXXXXX with the new design implementation remove login access for tokens!
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

func (ctx *Ctx) HandleLogin2() {
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
		user.TouchAccess()
		ctx.SetSessionUser(userId)
		ctx.ReturnUser()

	} else {
		ctx.ReturnBadRequest("Wrong username or password")
	}
}

func (ctx *Ctx) HandleDashboard() {
	user := ctx.ForceUser()
	hasSites, err := user.HasSiteLinks()
	ctx.CatchError(err)
	if hasSites {
		http.Redirect(ctx.w, ctx.r, "/new/dashboard.html", http.StatusTemporaryRedirect)
	} else {
		http.Redirect(ctx.w, ctx.r, "/new/setup.html", http.StatusTemporaryRedirect)
	}
}

func (ctx *Ctx) handleLogout() {
	ctx.Logout()
	http.Redirect(ctx.w, ctx.r, "/app", http.StatusTemporaryRedirect)
}

func (ctx *Ctx) handleLogout2() {
	ctx.Logout()
	next := ctx.r.FormValue("next")
	var redirectURL string
	if next == "login" {
		redirectURL = "/new/welcome.html?sign-in"
	} else {
		redirectURL = "/new"
	}
	http.Redirect(ctx.w, ctx.r, redirectURL, http.StatusTemporaryRedirect)
}

func (ctx *Ctx) handleDeleteUser() {
	ctx.checkMethod("POST")
	confirmUser := ctx.r.FormValue("confirmUser")
	user := ctx.ForceUser()
	if user.Id != confirmUser {
		ctx.ReturnBadRequest("Confirmation failed")
	}
	ctx.Logout()
	user.DelAllSites()
	user.Disable()
	http.Redirect(ctx.w, ctx.r, "/new", http.StatusTemporaryRedirect)
}

func (ctx *Ctx) HandleDeleteSite() {
	user := ctx.ForceUser()
	site := ctx.r.FormValue("site")
	confirmSite := ctx.r.FormValue("confirmSite")
	if site != confirmSite {
		ctx.ReturnBadRequest("Confirmation failed")
	}
	user.NewSite(site).Del()
	user.DelSiteLink(site)
	user.Signal()
}

func (ctx *Ctx) HandleDeleteToken() {
	user := ctx.ForceUser()
	err := user.DeleteToken()
	ctx.CatchError(err)
	user.Signal()
}

func (ctx *Ctx) HandleResetToken() {
	user := ctx.ForceUser()
	err := user.ResetToken()
	ctx.CatchError(err)
	user.Signal()
}

func (ctx *Ctx) handleRegister() {
	userId := ctx.r.FormValue("user")
	password := ctx.r.FormValue("password")
	if userId == "" {
		ctx.ReturnBadRequest("Missing Input: user")
	}
	if password == "" {
		ctx.ReturnBadRequest("Missing Input: password")
	}

	user := ctx.User(userId)

	err := user.Create(password)
	switch err.(type) {
	case nil:

		utcoffset := fmt.Sprintf("%d", ctx.ParseUTCOffset("utcoffset"))
		err := user.SetPref("utcoffset", utcoffset)
		ctx.CatchError(err)

		ctx.SetSessionUser(userId)
		ctx.ReturnUser()

	case *models.ErrUser:
		ctx.ReturnBadRequest(err.Error())

	default:
		ctx.ReturnInternalError(err)
	}
}

func (ctx *Ctx) handleAccountEdit() {
	ctx.checkMethod("POST")
	currentPassword := ctx.r.FormValue("current_password")
	newPassword := ctx.r.FormValue("new_password")
	repeatNewPassword := ctx.r.FormValue("repeat_new_password")

	user := ctx.ForceUser()

	if ctx.r.FormValue("utcoffset") != "" {
		utcoffset := fmt.Sprintf("%d", ctx.ParseUTCOffset("utcoffset"))
		err := user.SetPref("utcoffset", utcoffset)
		ctx.CatchError(err)
	}


	// assume the user is trying to change the password
	if newPassword != "" || repeatNewPassword != "" {

		if currentPassword == "" {
			ctx.ReturnBadRequest("Missing Input: current password")
		}
		if newPassword == "" {
			ctx.ReturnBadRequest("Missing Input: new password")
		}
		if repeatNewPassword == "" {
			ctx.ReturnBadRequest("Missing Input: repeat new password")
		}

		if len(newPassword) < 8 {
			ctx.ReturnBadRequest("New password must have at least 8 charachters")
		}

		if newPassword != repeatNewPassword {
			ctx.ReturnBadRequest("Repeated new password does not match with new password")
		}

		correctPassword, err := user.VerifyPassword(currentPassword)
		ctx.CatchError(err)

		if !correctPassword {
			ctx.ReturnBadRequest("Current password is wrong")
		}

		err = user.ChangePassword(newPassword)
		ctx.CatchError(err)
		ctx.Logout()
	}
}

func (ctx *Ctx) handleSetPrefRange() {
	user := ctx.ForceUser()
	err := user.SetPref("range", ctx.r.URL.RawQuery)
	ctx.CatchError(err)

}

func (ctx *Ctx) handleSetPrefSite() {
	user := ctx.ForceUser()
	err := user.SetPref("site", ctx.r.URL.RawQuery)
	ctx.CatchError(err)

}

type PingDataResp struct {
	Visits    models.TimedVisits `json:"visits"`
	Logs      models.LogData     `json:"logs"`
	SiteLinks map[string]int     `json:"site_links"`
}

func (ctx *Ctx) handlePing() {
	siteId := ctx.r.URL.RawQuery
	if siteId == "" {
		ctx.ReturnBadRequest("no siteId given as raw query param")
	}
	user := ctx.ForceUser()
	visits := user.NewSite(siteId)

	// if parameter wait is set:
	//err := visits.WaitForSignal()
	//ctx.CatchError(err)

	timedVisits, err := visits.GetVisits(ctx.ParseUTCOffset("utcoffset"))
	ctx.CatchError(err)
	logs, err := visits.GetLogs()
	ctx.CatchError(err)
	siteLinks, err := user.GetSiteLinks()
	ctx.CatchError(err)
	resp := PingDataResp{Visits: timedVisits, Logs: logs, SiteLinks: siteLinks}
	ctx.ReturnJSON(resp, 200)
}

func (ctx *Ctx) handleLoadComponentsJS() {
	// SEND HEADERS FOR CLOUDFROM HTTP PUSH AND TEST THAT
	files1, err := filepath.Glob("./static/comp/*.js")
	ctx.CatchError(err)
	files2, err := filepath.Glob("./static/comp/*/*.js")
	ctx.CatchError(err)
	files3, err := filepath.Glob("./static/comp/*/*/*.js")
	ctx.CatchError(err)
	files := append(append(files1, files2...), files3...)

	// this works, but breaks the frontend - you fix it!
	//for _, file := range files {
	// ctx.w.Header().Add("Link", fmt.Sprintf("</%s>; rel=preload;", file))
	//}

	filesJson, err := json.Marshal(files)
	ctx.CatchError(err)
	ctx.Return(fmt.Sprintf(`
        %s.sort().map(file => {
            let script = document.createElement("script");
            script.src = '/' + file.slice(7); script.async = false;
            document.head.appendChild(script)})`, filesJson), 200)
}

func (ctx *Ctx) handleLoadComponentsJS2() {
	// SEND HEADERS FOR CLOUDFROM HTTP PUSH AND TEST THAT
	files1, err := filepath.Glob("./static/new/components/*.js")
	ctx.CatchError(err)
	files2, err := filepath.Glob("./static/new/components/*/*.js")
	ctx.CatchError(err)
	files3, err := filepath.Glob("./static/new/components/*/*/*.js")
	ctx.CatchError(err)
	files := append(append(files1, files2...), files3...)

	// this works, but breaks the frontend - you fix it!
	//for _, file := range files {
	// ctx.w.Header().Add("Link", fmt.Sprintf("</%s>; rel=preload;", file))
	//}

	filesJson, err := json.Marshal(files)
	ctx.CatchError(err)
	ctx.Return(fmt.Sprintf(`
        %s.sort().map(file => {
            let script = document.createElement("script");
            script.src = '/' + file.slice(7); script.async = false;
            document.head.appendChild(script)})`, filesJson), 200)
}

func (ctx *Ctx) handleUser() {
	ctx.ReturnUser()
}

func (ctx *Ctx) handleDump() {

	ctx.w.Header().Set("Content-Type", "text/event-stream")
	ctx.w.Header().Set("Cache-Control", "no-cache")
	ctx.w.Header().Set("Connection", "keep-alive")

	f, ok := ctx.w.(http.Flusher)
	if !ok {
		panic("Flush not supported by library")
	}

	utcOffset := ctx.ParseUTCOffset("utcoffset")
	sessionlessUserId := ctx.GetSessionlessUserId()
	userId := ctx.GetUserId()
	var user models.User
	meta := map[string]string{}
	if ctx.r.FormValue("demo") != "" {
		user = ctx.User("counter") // counter is the magic demo user
		meta = map[string]string{"demo": "1"}
	} else if sessionlessUserId != "" {
		user = ctx.User(sessionlessUserId)
		meta = map[string]string{"sessionless": "1"}
	} else if userId != "" {
		user = ctx.User(userId)
	} else {
		fmt.Fprintf(ctx.w, "data: null\n\n")
		return
	}

	sendDump := func() {
		dump, err := LoadDump(user, utcOffset)
		ctx.CatchError(err)
		dump.Meta = meta
		jsonString, err := json.Marshal(dump)
		ctx.CatchError(err)
		fmt.Fprintf(ctx.w, "data: %s\n\n", string(jsonString))
		f.Flush()
	}

	sendDump()
	conn, err := redis.DialURL(ctx.app.config.RedisUrl)
	ctx.CatchError(err)
	ctx.openConns = append(ctx.openConns, conn)
	user.HandleSignals(conn, func(err error) {

		// this happens because we close the connection to redis when
		// we lose the http connection tot he client. But this piece of
		// code apparently still remains there int he air.
		if err != nil && strings.Contains(err.Error(), "use of closed network connection") {
			ctx.Abort()
		}

		ctx.CatchError(err)
		sendDump()
	})
}
