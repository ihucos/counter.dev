package endpoints

import (
	"fmt"
	"strings"

	"github.com/ihucos/counter.dev/lib"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		ctx.CheckMethod("POST")
		currentPassword := ctx.R.FormValue("current_password")
		newPassword := ctx.R.FormValue("new_password")
		repeatNewPassword := ctx.R.FormValue("repeat_new_password")
		sites := ctx.R.FormValue("sites")
		useSites := ctx.R.FormValue("usesites")
		mail := ctx.R.FormValue("mail")

		user := ctx.ForceUser()

		if useSites != "" && len(strings.Fields(sites)) < 1 {
			ctx.ReturnBadRequest("This 'Listed Domains' option needs at least one site as input")
		}
		ctx.SetPref("sites", sites)
		ctx.SetPref("usesites", useSites)
		ctx.SetPref("mail", mail)

		if ctx.R.FormValue("utcoffset") != "" {
			utcoffset := fmt.Sprintf("%d", ctx.ParseUTCOffset("utcoffset"))
			ctx.SetPref("utcoffset", utcoffset)
		}

		// assume the user is trying to change the password
		if newPassword != "" || repeatNewPassword != "" {

			if currentPassword == "" {
				ctx.ReturnBadRequest("Missing Input: current password")
			}
			if newPassword == "" {
				ctx.ReturnBadRequest("Missing Input: new password")
			}
			if repeatNewPassword == "" {
				ctx.ReturnBadRequest("Missing Input: repeat new password")
			}

			if len(newPassword) < 8 {
				ctx.ReturnBadRequest("New password must have at least 8 characters")
			}

			if newPassword != repeatNewPassword {
				ctx.ReturnBadRequest("Repeated new password does not match with new password")
			}

			passwordOk, err := user.VerifyPasswordOrTmpPassword(currentPassword)
			ctx.CatchError(err)

			if !passwordOk {
				ctx.ReturnBadRequest("Current password is wrong")
			}

			err = user.ChangePassword(newPassword)
			ctx.CatchError(err)
			ctx.Logout()
		}
	})
}
