package endpoints

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Handler(func(ctx *lib.Ctx) {
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
}
