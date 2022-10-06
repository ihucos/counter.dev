package endpoints

import (
	"github.com/ihucos/counter.dev/lib"
	"github.com/ihucos/counter.dev/models"
	"time"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		var user models.User
		if ctx.R.FormValue("demo") == "1" {
			user = ctx.User("counter") // that magic user again
		} else {
			user = ctx.ForceUser()
		}
		from, err := time.Parse("2006-01-02", ctx.R.FormValue("from"))
		ctx.CatchError(err)
		to, err := time.Parse("2006-01-02", ctx.R.FormValue("to"))
		ctx.CatchError(err)
		fetched, err := ctx.App.QueryArchive(lib.QueryArchiveArgs{
			User:     user.Id,
			DateFrom: from,
			DateTo:   to,
		})
		ctx.CatchError(err)
		ctx.ReturnJSON(fetched, 200)

	})
}
