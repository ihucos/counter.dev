
package endpoints

import (
	"github.com/ihucos/counter.dev/lib"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		subID := ctx.R.FormValue("subscription_id")
		user := ctx.ForceUser()
		err := user.RegisterSubscriptionID(subID)
		ctx.CatchError(err)
	})
}
