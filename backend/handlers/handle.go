package handlers

import (
	"encoding/json"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/lib"
	"github.com/ihucos/counter.dev/models"
	"github.com/ihucos/counter.dev/utils"
	"net/http"
	"path/filepath"
	"strings"
	"time"
	"regexp"
	"net/url"

	"github.com/avct/uasurfer"
	"golang.org/x/text/language"
	"golang.org/x/text/language/display"
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

func Origin2SiteId(origin string) string {
	// this function returns
	var re = regexp.MustCompile(`^.*?:\/\/(?:www.)?(.*)$`)
	var match = re.FindStringSubmatch(origin)
	if len(match) < 1 {
		return origin
	}
	return match[1]
}

func LoadSitesDump(user models.User, utcOffset int) (SitesDump, error) {
	sitesDump := make(SitesDump)

	sitesLink, err := user.GetPreferredSiteLinks()
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

func init() {
	lib.Endpoint("/login", func(ctx *lib.Ctx) {
		userId := ctx.R.FormValue("user")
		passwordInput := ctx.R.FormValue("password")
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

	lib.Endpoint("/dashboard", func(ctx *lib.Ctx) {
		user := ctx.ForceUser()
		hasSites, err := user.HasSiteLinks()
		ctx.CatchError(err)
		if hasSites {
			http.Redirect(ctx.W, ctx.R, "/dashboard.html", http.StatusTemporaryRedirect)
		} else {
			http.Redirect(ctx.W, ctx.R, "/setup.html", http.StatusTemporaryRedirect)
		}
	})

	lib.Endpoint("/logout", func(ctx *lib.Ctx) {
		ctx.Logout()
		next := ctx.R.FormValue("next")
		var redirectURL string
		if next == "login" {
			redirectURL = "/welcome.html?sign-in"
		} else {
			redirectURL = "/"
		}
		http.Redirect(ctx.W, ctx.R, redirectURL, http.StatusTemporaryRedirect)
	})

	lib.Endpoint("/deleteUser", func(ctx *lib.Ctx) {
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

	lib.Endpoint("/deletesite", func(ctx *lib.Ctx) {
		user := ctx.ForceUser()
		site := ctx.R.FormValue("site")
		confirmSite := ctx.R.FormValue("confirmSite")
		if site != confirmSite {
			ctx.ReturnBadRequest("Confirmation failed")
		}
		user.NewSite(site).Del()
		deleted, err := user.DelSiteLink(site)
		ctx.CatchError(err)
		if !deleted {
			ctx.ReturnBadRequest("Logged in user does not have such a site")
		}
		user.Signal()
	})

	lib.Endpoint("/deletetoken", func(ctx *lib.Ctx) {
		user := ctx.ForceUser()
		err := user.DeleteToken()
		ctx.CatchError(err)
		user.Signal()
	})

	lib.Endpoint("/resettoken", func(ctx *lib.Ctx) {
		user := ctx.ForceUser()
		err := user.ResetToken()
		ctx.CatchError(err)
		user.Signal()
	})

	lib.Endpoint("/register", func(ctx *lib.Ctx) {
		userId := ctx.R.FormValue("user")
		password := ctx.R.FormValue("password")
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

			ctx.LogEvent("register")

			utcoffset := fmt.Sprintf("%d", ctx.ParseUTCOffset("utcoffset"))
			ctx.SetPref("utcoffset", utcoffset)

			ctx.SetSessionUser(userId)
			ctx.ReturnUser()

		case *models.ErrUser:
			ctx.ReturnBadRequest(err.Error())

		default:
			ctx.ReturnInternalError(err)
		}
	})

	lib.Endpoint("/accountedit", func(ctx *lib.Ctx) {
		ctx.CheckMethod("POST")
		currentPassword := ctx.R.FormValue("current_password")
		newPassword := ctx.R.FormValue("new_password")
		repeatNewPassword := ctx.R.FormValue("repeat_new_password")
		sites := ctx.R.FormValue("sites")
		useSites := ctx.R.FormValue("usesites")

		user := ctx.ForceUser()

		if useSites != "" && len(strings.Fields(sites)) < 1 {
			ctx.ReturnBadRequest("This 'Listed Domains' option needs at least one site as input")
		}
		ctx.SetPref("sites", sites)
		ctx.SetPref("usesites", useSites)

		if ctx.R.FormValue("utcoffset") != "" {
			utcoffset := fmt.Sprintf("%d", ctx.ParseUTCOffset("utcoffset"))
			ctx.SetPref("utcoffset", utcoffset)
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
	})

	lib.Endpoint("/setPrefRange", func(ctx *lib.Ctx) {
		ctx.SetPref("range", ctx.R.URL.RawQuery)

	})

	lib.Endpoint("/setPrefSite", func(ctx *lib.Ctx) {
		ctx.SetPref("site", ctx.R.URL.RawQuery)

	})

	type PingDataResp struct {
		Visits    models.TimedVisits `json:"visits"`
		Logs      models.LogData     `json:"logs"`
		SiteLinks map[string]int     `json:"site_links"`
	}

	lib.Endpoint("/load.js", func(ctx *lib.Ctx) {
		files1, err := filepath.Glob("./static/components/*.js")
		ctx.CatchError(err)
		files2, err := filepath.Glob("./static/components/*/*.js")
		ctx.CatchError(err)
		files3, err := filepath.Glob("./static/components/*/*/*.js")
		ctx.CatchError(err)
		files := append(append(files1, files2...), files3...)

		// this works, but breaks the frontend - you fix it!
		for _, file := range files {
			ctx.W.Header().Add("Link", fmt.Sprintf("<%s>; rel=preload; as=script", file[len("static"):]))
		}

		filesJson, err := json.Marshal(files)
		ctx.CatchError(err)
		ctx.Return(fmt.Sprintf(`
	        %s.sort().map(file => {
	            let script = document.createElement("script");
	            script.src = '/' + file.slice(7); script.async = false;
	            document.head.appendChild(script)})`, filesJson), 200)
	})

	lib.Endpoint("/user", func(ctx *lib.Ctx) {
		ctx.ReturnUser()
	})

	lib.Endpoint("/dump", func(ctx *lib.Ctx) {

		ctx.W.Header().Set("Content-Type", "text/event-stream")
		ctx.W.Header().Set("Cache-Control", "no-cache")
		ctx.W.Header().Set("Connection", "keep-alive")

		f, ok := ctx.W.(http.Flusher)
		if !ok {
			panic("Flush not supported by library")
		}

		utcOffset := ctx.ParseUTCOffset("utcoffset")
		sessionlessUserId := ctx.GetSessionlessUserId()
		userId := ctx.GetUserId()
		var user models.User
		meta := map[string]string{}
		if ctx.R.FormValue("demo") != "" {
			user = ctx.User("counter") // counter is the magic demo user
			meta = map[string]string{"demo": "1"}
		} else if sessionlessUserId != "" {
			user = ctx.User(sessionlessUserId)
			meta = map[string]string{"sessionless": "1"}
		} else if userId != "" {
			user = ctx.User(userId)
		} else {
			fmt.Fprintf(ctx.W, "data: null\n\n")
			return
		}

		sendDump := func() {
			dump, err := LoadDump(user, utcOffset)
			ctx.CatchError(err)
			dump.Meta = meta
			jsonString, err := json.Marshal(dump)
			ctx.CatchError(err)
			fmt.Fprintf(ctx.W, "data: %s\n\n", string(jsonString))
			f.Flush()
		}

		sendDump()

		conn, err := redis.DialURL(ctx.App.Config.RedisUrl)
		ctx.CatchError(err)
		ctx.OpenConns = append(ctx.OpenConns, conn)

		//
		// If the user get's a lot of views, we will suffocate the frontend
		// with two many dumb pushs. TODO: throttle it to something around max
		// ~2 pers seconds.
		//

		// DOING THE ABOVE COMMENT FOR HACKER NEWS: rework this!

		lastDump := time.Now()

		user.HandleSignals(conn, func(err error) {

			// this happens because we close the connection to redis when
			// we lose the http connection tot he client. But this piece of
			// code apparently still remains there int he air.
			if err != nil && strings.Contains(err.Error(), "use of closed network connection") {
				ctx.Abort()
			}

			ctx.CatchError(err)

			if time.Since(lastDump) > time.Second*1 {
				sendDump()
				lastDump = time.Now()
			}
		})
	})

	lib.Endpoint("/track", func(ctx *lib.Ctx) {
		visit := make(models.Visit)

		//
		// Input validation
		//
		userId := ctx.R.FormValue("user")
		if userId == "" {
			// this has to be supported until the end of time, or
			// alternatively all current users are not using that option.
			userId = ctx.R.FormValue("site")
			if userId == "" {
				ctx.ReturnBadRequest("missing site param")
			}
		}

		//
		// variables
		//
		now := utils.TimeNow(ctx.ParseUTCOffset("utcoffset"))
		userAgent := ctx.R.Header.Get("User-Agent")
		ua := uasurfer.Parse(userAgent)
		origin := ctx.R.Header.Get("Origin")
		if origin == "" || origin == "null" {
			ctx.ReturnBadRequest("Origin header can not be empty, not set or \"null\"")
		}

		// ignore some origins
		if strings.HasSuffix(origin, ".translate.goog") {
			ctx.ReturnBadRequest("Ignoring due origin")
		}

		//
		// set expire
		//
		ctx.W.Header().Set("Expires", now.Format("Mon, 2 Jan 2006")+" 23:59:59 GMT")

		//
		// Not strictly necessary but avoids the browser issuing an error.
		//
		ctx.W.Header().Set("Access-Control-Allow-Origin", "*")

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

		refParam := ctx.R.FormValue("referrer")
		parsedUrl, err := url.Parse(refParam)
		if err == nil && parsedUrl.Host != "" {
			visit["ref"] = parsedUrl.Host
		}

		ref := ctx.R.Header.Get("Referer")
		parsedUrl, err = url.Parse(ref)
		if err == nil && parsedUrl.Path != "" {
			visit["loc"] = parsedUrl.Path
		}

		tags, _, err := language.ParseAcceptLanguage(ctx.R.Header.Get("Accept-Language"))
		if err == nil && len(tags) > 0 {
			lang := display.English.Languages().Name(tags[0])
			visit["lang"] = lang
		}

		country := ctx.R.Header.Get("CF-IPCountry")
		if country != "" && country != "XX" {
			visit["country"] = strings.ToLower(country)
		}

		screenInput := ctx.R.FormValue("screen")
		if screenInput != "" {
			_, screenExists := models.ScreenResolutions[screenInput]
			if screenExists {
				visit["screen"] = screenInput
			} else {
				visit["screen"] = "Other"
			}
		}

		device := ua.DeviceType.StringTrimPrefix()

		visit["date"] = now.Format("2006-01-02")

		visit["weekday"] = fmt.Sprintf("%d", now.Weekday())

		visit["hour"] = fmt.Sprintf("%d", now.Hour())

		visit["browser"] = ua.Browser.Name.StringTrimPrefix()

		visit["device"] = device

		visit["platform"] = ua.OS.Platform.StringTrimPrefix()

		//
		// save visit map
		//
		logLine := fmt.Sprintf("[%s] %s %s %s", now.Format("2006-01-02 15:04:05"), country, refParam, device)

		siteId := Origin2SiteId(origin)
		user := ctx.User(userId)
		visits := user.NewSite(siteId)
		visits.SaveVisit(visit, now)
		visits.Log(logLine)
		user.IncrSiteLink(siteId)
		user.Signal()

		ctx.W.Header().Set("Content-Type", "text/plain")
		ctx.W.Header().Set("Cache-Control", "public, immutable")
		ctx.Return("OK", 200)

	})

}
