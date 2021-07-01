package endpoints

import (
	"fmt"

	"github.com/ihucos/counter.dev/lib"
	"github.com/ihucos/counter.dev/models"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		userId := ctx.R.FormValue("user")
		password := ctx.R.FormValue("password")
		if userId == "" {
			ctx.ReturnBadRequest("Missing Input: user")
		}
		if password == "" {
			ctx.ReturnBadRequest("Missing Input: password")
		}

		user := ctx.User(userId)

		err := user.Create(password)
		switch err.(type) {
		case nil:

			ctx.LogEvent("register")

			utcoffset := fmt.Sprintf("%d", ctx.ParseUTCOffset("utcoffset"))
			ctx.SetPref("utcoffset", utcoffset)

			ctx.SetSessionUser(userId)
			ctx.ReturnUser()

		case *models.ErrUser:
			ctx.ReturnBadRequest(err.Error())

		default:
			ctx.ReturnInternalError(err)
		}
	})
}
