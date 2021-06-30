package endpoints

import "github.com/ihucos/counter.dev/lib"

func Origin2SiteId(origin string) string {
	// this function returns
	var re = regexp.MustCompile(`^.*?:\/\/(?:www.)?(.*)$`)
	var match = re.FindStringSubmatch(origin)
	if len(match) < 1 {
		return origin
	}
	return match[1]
}

func init() {
	lib.Handler(func(ctx *lib.Ctx) {
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
