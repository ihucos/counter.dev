package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"strconv"

	"github.com/avct/uasurfer"
	"golang.org/x/text/language"
	"golang.org/x/text/language/display"
	"runtime"
)

type Ctx struct {
	w     http.ResponseWriter
	r     *http.Request
	users Users
}

func (ctx Ctx) Abort() {
	panic(AbortPanic{})
}

func (ctx Ctx) Return(content string, statusCode int) {
	ctx.w.WriteHeader(statusCode)
	ctx.w.Write([]byte(content))
	ctx.Abort()
}

func (ctx Ctx) ReturnJSON(v interface{}, statusCode int) {
	jsonString, err := json.Marshal(v)
	ctx.CatchError(err)
	ctx.Return(string(jsonString), statusCode)
}

func (ctx Ctx) ReturnError(err error) {
	_, file, line, _ := runtime.Caller(1)
	fmt.Printf("%s:%d %s: %v\n", file, line, ctx.r.URL, err)
	ctx.Return(err.Error(), 500)
}

func (ctx Ctx) CatchError(err error) {
	if err != nil {
		ctx.ReturnError(err)
	}
}

func (ctx Ctx) ParseUTCOffset(key string) int {
	utcOffset, err := strconv.Atoi(ctx.r.FormValue(key))
	if err != nil {
		utcOffset = 0
	}
	return max(min(utcOffset, 14), -12)
}

func (ctx Ctx) SetSessionUser(userId string) {
	session, _ := store.Get(ctx.r, "swa")
	session.Values["user"] = userId
	session.Save(ctx.r, ctx.w)
}

func (ctx Ctx) ForceUserId() string {
	session, _ := store.Get(ctx.r, "swa")
	userId, ok := session.Values["user"].(string)
	if !ok {
		ctx.Return("Forbidden", 403)
	}
	return userId
}

func (ctx Ctx) ReturnUserData(userId string) {
	user := ctx.users.New(userId)
	defer user.Close()

	userData, err := user.GetData(ctx.ParseUTCOffset("utcoffset"))
	ctx.CatchError(err)
	ctx.ReturnJSON(userData, 200)
}

//func (ctx Ctx) Authenticate() {
//	ctx.User = ctx.users.New(ctx.ForceUserId())
//
//}

func (ctx Ctx) ReturnTrackingPage() {

	visit := make(Visit)

	//
	// Input validation
	//

	userId := ctx.r.FormValue("site")
	if userId == "" {
		ctx.Return("missing site param", 400)
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

	user := ctx.users.New(userId)
	defer user.Close()
	user.SaveVisit(visit, now)
	user.SaveLogLine(logLine)

	ctx.w.Header().Set("Content-Type", "text/plain")
	ctx.w.Header().Set("Cache-Control", "public, immutable")
	ctx.Return("OK", 200)

}

func (ctx Ctx) ReturnRegisterPage() {
	userId := truncate(ctx.r.FormValue("user"))
	password := ctx.r.FormValue("password")
	if userId == "" || password == "" {
		ctx.Return("Missing Input", 400)
	}

	user := ctx.users.New(userId)
	defer user.Close()

	err := user.Create(password)
	switch err.(type) {
	case nil:
		ctx.Return("OK", 200)

	case *ErrCreate:
		ctx.Return(err.Error(), 400)

	default:
		ctx.ReturnError(err)
	}
}

func (ctx Ctx) ReturnLoginPage() {

	userId := ctx.r.FormValue("user")
	passwordInput := ctx.r.FormValue("password")
	if userId == "" || passwordInput == "" {
		ctx.Return("Missing Input", 400)
	}

	user := ctx.users.New(userId)
	defer user.Close()

	passwordOk, err := user.VerifyPassword(passwordInput)
	ctx.CatchError(err)
	tokenOk, err := user.VerifyToken(passwordInput)
	ctx.CatchError(err)

	if passwordOk || tokenOk {
		user.TouchAccess()
		ctx.SetSessionUser(userId)
		ctx.ReturnUserData(userId)

	} else {
		ctx.Return("Wrong username or password", 400)
	}
}

func (ctx Ctx) ReturnDataPage() {
	ctx.ReturnUserData(ctx.ForceUserId())
}
