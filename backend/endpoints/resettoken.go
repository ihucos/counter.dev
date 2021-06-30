package endpoints

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Handler(func(ctx *lib.Ctx) {
		user := ctx.ForceUser()
		err := user.ResetToken()
		ctx.CatchError(err)
		user.Signal()
	})
}
