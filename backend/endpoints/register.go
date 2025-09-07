package endpoints

import (
	"fmt"

	"github.com/ihucos/counter.dev/lib"
	"github.com/ihucos/counter.dev/models"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		userId := ctx.R.FormValue("user")
		mail := ctx.R.FormValue("mail")
		password := ctx.R.FormValue("password")
		timezone := ctx.R.FormValue("timezone")
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

			// Helper: set legacy utcoffset only if request provided it
			setUTCOffsetIfPresent := func() {
				if _, ok := ctx.R.Form["utcoffset"]; ok {
					utcoffset := fmt.Sprintf("%d", ctx.ParseUTCOffset("utcoffset"))
					err := user.SetPref("utcoffset", utcoffset)
					ctx.CatchError(err)
				}
			}

			// Prioritize IANA timezone for new users
			if timezone != "" {
				if err := user.SetTimezone(timezone); err != nil {
					ctx.ReturnBadRequest("Invalid timezone")
					return
				}
				// Best-effort legacy storage only when provided
				setUTCOffsetIfPresent()
			} else {
				// Fallback: only store utcoffset if provided by client
				setUTCOffsetIfPresent()
			}
			if mail != "" {
				err := user.SetPref("mail", mail)
				ctx.CatchError(err)
			}

			ctx.SetSessionUser(userId)
			ctx.ReturnUser()

		case *models.ErrUser:
			ctx.ReturnBadRequest(err.Error())

		default:
			ctx.ReturnInternalError(err)
		}
	})
}
