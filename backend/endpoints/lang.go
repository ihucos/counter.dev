
package endpoints

import (
	"github.com/ihucos/counter.dev/lib"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		country := ctx.R.Header.Get("CF-IPCountry")
		ctx.Return(country, 200)
	})
}
