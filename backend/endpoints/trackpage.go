package endpoints

import (
	"github.com/ihucos/counter.dev/lib"
	"github.com/ihucos/counter.dev/models"
	"github.com/ihucos/counter.dev/utils"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		visit := make(models.Visit)

		user := ctx.UserByCachedUUID(ctx.R.FormValue("id"))
		now := utils.TimeNow(ctx.ParseUTCOffset("utcoffset"))

		// visit is a weird name, I should rename that to something
		// else. It must not be necessarily a visit, it's just a
		// counter
		visit["page"] = ctx.R.FormValue("page")
		visit["count"] = "pageview"

		origin := ctx.R.Header.Get("Origin")
		if origin == "" || origin == "null" {
			ctx.ReturnBadRequest("Origin header can not be empty, not set or \"null\"")
		}
		siteId := Origin2SiteId(origin)
		visits := user.NewSite(siteId)
		visits.SaveVisit(visit, now)
		// user.Signal() - uncommented to save some resources I guess.

		//
		// Not strictly necessary but avoids the browser issuing an error.
		//
		ctx.W.Header().Set("Access-Control-Allow-Origin", "*")

		ctx.Return("", 204)

	})
}
