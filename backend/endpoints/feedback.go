package endpoints

import (
	"fmt"
	"github.com/ihucos/counter.dev/lib"
	"gopkg.in/gomail.v2"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		mail := ctx.R.FormValue("contact")
		feedback := ctx.R.FormValue("feedback")
		if feedback == "" {
			ctx.ReturnBadRequest("No input given.")
		}
		user := ctx.GetUserId()
		m := gomail.NewMessage()

		m.SetHeader("From", "hey@counter.dev")
		m.SetHeader("To", "hey@counter.dev")
		m.SetBody("text/plain", feedback)

		var title string
		if user == "" {
			title = "User feedback received"
		} else {
			title = fmt.Sprintf("User feedback received from %s", user)
		}
		if mail != "" {
			title += fmt.Sprintf(" (%s)", mail)
		}
		m.SetHeader("Subject", title)

		d := gomail.NewDialer("smtp.protonmail.ch", 587, "hey@counter.dev", ctx.App.Config.SMTPSecret)

		err := d.DialAndSend(m)
		if err != nil {
			ctx.CatchError(err)
		}
		ctx.Return("Thanks ❤️. We'll look into it.", 200)
	})
}
