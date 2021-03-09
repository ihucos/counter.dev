package main

import (
	"./models"
	"./utils"
	"fmt"
	"net/url"
	"regexp"
	"strings"

	"github.com/avct/uasurfer"
	"golang.org/x/text/language"
	"golang.org/x/text/language/display"
)

func (ctx *Ctx) handleTrack() {
	visit := make(models.Visit)

	//
	// Input validation
	//
	userId := ctx.r.FormValue("user")
	if userId == "" {
		// this has to be supported until the end of time, or
		// alternatively all current users are not using that option.
		userId = ctx.r.FormValue("site")
		if userId == "" {
			ctx.ReturnBadRequest("missing site param")
		}
	}

	//
	// variables
	//
	now := utils.TimeNow(ctx.ParseUTCOffset("utcoffset"))
	userAgent := ctx.r.Header.Get("User-Agent")
	ua := uasurfer.Parse(userAgent)
	origin := ctx.r.Header.Get("Origin")
	if origin == "" || origin == "null" {
		ctx.ReturnBadRequest("Origin header can not be empty, not set or \"null\"")
	}

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

	page := ctx.r.FormValue("page")
	if page != "" {
		visit["loc"] = page
	} else {
		// Fallback to Referer header
		ref := ctx.r.Header.Get("Referer")
		parsedUrl, err = url.Parse(ref)
		if err == nil && parsedUrl.Path != "" {
			visit["loc"] = parsedUrl.Path
		}
	}

	tags, _, err := language.ParseAcceptLanguage(ctx.r.Header.Get("Accept-Language"))
	if err == nil && len(tags) > 0 {
		lang := display.English.Languages().Name(tags[0])
		visit["lang"] = lang
	}

	country := ctx.r.Header.Get("CF-IPCountry")
	if country != "" && country != "XX" {
		visit["country"] = strings.ToLower(country)
	}

	screenInput := ctx.r.FormValue("screen")
	if screenInput != "" {
		_, screenExists := models.ScreenResolutions[screenInput]
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

	siteId := Origin2SiteId(origin)
	user := ctx.User(userId)
	visits := user.NewSite(siteId)
	visits.SaveVisit(visit, now)
	visits.Log(logLine)
	user.IncrSiteLink(siteId)
	user.Signal()

	ctx.w.Header().Set("Content-Type", "text/plain")
	ctx.w.Header().Set("Cache-Control", "public, immutable")
	ctx.Return("OK", 200)

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
