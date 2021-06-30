package endpoints

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Handler(func(ctx *lib.Ctx) {
		ctx.SetPref("range", ctx.R.URL.RawQuery)

	})
}
