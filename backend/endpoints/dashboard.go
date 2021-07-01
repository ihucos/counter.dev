package endpoints

import (
	"net/http"

	"github.com/ihucos/counter.dev/lib"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		user := ctx.ForceUser()
		hasSites, err := user.HasSiteLinks()
		ctx.CatchError(err)
		if hasSites {
			http.Redirect(ctx.W, ctx.R, "/dashboard.html", http.StatusTemporaryRedirect)
		} else {
			http.Redirect(ctx.W, ctx.R, "/setup.html", http.StatusTemporaryRedirect)
		}
	})
}
