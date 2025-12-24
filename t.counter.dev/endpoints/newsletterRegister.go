package endpoints

import "net/mail"

import "github.com/ihucos/counter.dev/lib"

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		userMail := ctx.R.FormValue("mail")
		_, err := mail.ParseAddress(userMail)
		if err != nil {
			ctx.ReturnBadRequest("No no no, that is not an email")
		}
		ctx.App.Logger.Printf("newsletter mail: %s\n", userMail)
		ctx.Return("Success", 200)
	})
}
