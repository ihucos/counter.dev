package endpoints

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		ctx.SetPref("site", ctx.R.URL.RawQuery)
	})
}
