package main

import (
	"fmt"
	"net/url"
	"strings"

	"github.com/avct/uasurfer"
	"golang.org/x/text/language"
	"golang.org/x/text/language/display"
)

var Handlers = map[string]func(Ctx){
	"/login": func(ctx Ctx) {
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
			ctx.ReturnUserData(userId)

		} else {
			ctx.ReturnBadRequest("Wrong username or password")
		}
	},
	"/register": func(ctx Ctx) {
		userId := truncate(ctx.r.FormValue("user"))
		password := ctx.r.FormValue("password")
		if userId == "" || password == "" {
			ctx.ReturnBadRequest("Missing Input")
		}

		user := ctx.app.OpenUser(userId)
		defer user.Close()

		err := user.Create(password)
		switch err.(type) {
		case nil:
			ctx.ReturnUserData(userId)

		case *ErrCreate:
			ctx.ReturnBadRequest(err.Error())

		default:
			ctx.ReturnInternalError(err)
		}
	},
	"/data": func(ctx Ctx) {
		ctx.ReturnUserData(ctx.ForceUserId())
	},
	"/track": func(ctx Ctx) {
		visit := make(Visit)

		//
		// Input validation
		//

		userId := ctx.r.FormValue("site")
		if userId == "" {
			ctx.ReturnBadRequest("missing site param")
		}

		//
		// variables
		//
		now := timeNow(ctx.ParseUTCOffset("utcoffset"))
		userAgent := ctx.r.Header.Get("User-Agent")
		ua := uasurfer.Parse(userAgent)
		origin := ctx.r.Header.Get("Origin")

		//
		// set expire
		//
		ctx.w.Header().Set("Expires", now.Format("Mon, 2 Jan 2006")+" 23:59:59 GMT")

		//
		// Not strictly necessary but avoids the browser issuing an error.
		//
		ctx.w.Header().Set("Access-Control-Allow-Origin", "*")

		//
		// drop if bot or origin is from localhost
		// see issue: https://github.com/avct/uasurfer/issues/65
		//
		if ua.IsBot() || strings.Contains(userAgent, " HeadlessChrome/") {
			return
		}
		originUrl, err := url.Parse(origin)
		if err == nil && (originUrl.Hostname() == "localhost" || originUrl.Hostname() == "127.0.0.1") {
			return
		}

		//
		// build visit map
		//

		refParam := ctx.r.FormValue("referrer")
		parsedUrl, err := url.Parse(refParam)
		if err == nil && parsedUrl.Host != "" {
			visit["ref"] = parsedUrl.Host
		}

		ref := ctx.r.Header.Get("Referer")
		parsedUrl, err = url.Parse(ref)
		if err == nil && parsedUrl.Path != "" {
			visit["loc"] = parsedUrl.Path
		}

		tags, _, err := language.ParseAcceptLanguage(ctx.r.Header.Get("Accept-Language"))
		if err == nil && len(tags) > 0 {
			lang := display.English.Languages().Name(tags[0])
			visit["lang"] = lang
		}

		if origin != "" && origin != "null" {
			visit["origin"] = origin
		}

		country := ctx.r.Header.Get("CF-IPCountry")
		if country != "" && country != "XX" {
			visit["country"] = strings.ToLower(country)
		}

		screenInput := ctx.r.FormValue("screen")
		if screenInput != "" {
			_, screenExists := screenResolutions[screenInput]
			if screenExists {
				visit["screen"] = screenInput
			} else {
				visit["screen"] = "Other"
			}
		}

		visit["date"] = now.Format("2006-01-02")

		visit["weekday"] = fmt.Sprintf("%d", now.Weekday())

		visit["hour"] = fmt.Sprintf("%d", now.Hour())

		visit["browser"] = ua.Browser.Name.StringTrimPrefix()

		visit["device"] = ua.DeviceType.StringTrimPrefix()

		visit["platform"] = ua.OS.Platform.StringTrimPrefix()

		//
		// save visit map
		//
		logLine := fmt.Sprintf("[%s] %s %s %s", now.Format("2006-01-02 15:04:05"), country, refParam, userAgent)

		user := ctx.app.OpenUser(userId)
		defer user.Close()
		user.SaveVisit(visit, now)
		user.SaveLogLine(logLine)

		ctx.w.Header().Set("Content-Type", "text/plain")
		ctx.w.Header().Set("Cache-Control", "public, immutable")
		ctx.Return("OK", 200)

	},
}
