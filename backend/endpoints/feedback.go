package endpoints

import (
	"context"
	"fmt"
	"github.com/ihucos/counter.dev/lib"
	"github.com/mailgun/mailgun-go/v4"
	"time"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		mail := ctx.R.FormValue("contact")
		feedback := ctx.R.FormValue("feedback")
		if feedback == "" {
			ctx.ReturnBadRequest("No input given.")
		}
		user := ctx.GetUserId()
		mg := mailgun.NewMailgun("counter.dev", ctx.App.Config.MailgunSecretApiKey)
		var title string
		if user == "" {
			title = "User feedback received"
		} else {
			title = fmt.Sprintf("User feedback received from %s", user)
		}
                if mail != "" {
                    title += fmt.Sprintf(" (%s)", mail)
                }
		message := mg.NewMessage("hey@counter.dev", title, feedback, "hey@counter.dev")
		c, cancel := context.WithTimeout(context.Background(), time.Second*30)
		defer cancel()
		_, _, err := mg.Send(c, message)

		if err != nil {
			ctx.CatchError(err)
		}
		ctx.Return("Thanks ❤️. We'll look into it.", 200)
	})
}
