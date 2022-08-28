package endpoints

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/lib"
	"github.com/ihucos/counter.dev/models"
)

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		ctx.W.Header().Set("Content-Type", "text/event-stream")
		ctx.W.Header().Set("Cache-Control", "no-cache")
		ctx.W.Header().Set("Connection", "keep-alive")

		f, ok := ctx.W.(http.Flusher)
		if !ok {
			panic("Flush not supported by library")
		}

		utcOffset := ctx.ParseUTCOffset("utcoffset")
		sessionlessUserId := ctx.GetSessionlessUserId()
		userId := ctx.GetUserId()
		var user models.User
		meta := map[string]string{}
		if ctx.R.FormValue("demo") != "" {
			user = ctx.User("counter") // counter is the magic demo user
			meta = map[string]string{"demo": "1"}
		} else if sessionlessUserId != "" {
			user = ctx.User(sessionlessUserId)
			meta = map[string]string{"sessionless": "1"}
		} else if userId != "" {
			user = ctx.User(userId)
		} else {
			fmt.Fprintf(ctx.W, "data: null\n\n")
			return
		}

		meta["alias"] = ctx.Encrypt(userId)

		sendDump := func() {
			dump, err := LoadDump(user, utcOffset)
			ctx.CatchError(err)
			dump.Meta = meta
			jsonString, err := json.Marshal(dump)
			ctx.CatchError(err)
			fmt.Fprintf(ctx.W, "data: %s\n\n", string(jsonString))
			f.Flush()
		}

		sendDump()

		conn, err := redis.DialURL(ctx.App.Config.RedisUrl)
		ctx.CatchError(err)
		ctx.OpenConns = append(ctx.OpenConns, conn)

		//
		// If the user get's a lot of views, we will suffocate the frontend
		// with two many dumb pushs. TODO: throttle it to something around max
		// ~2 pers seconds.
		//

		// DOING THE ABOVE COMMENT FOR HACKER NEWS: rework this!

		lastDump := time.Now()

		user.HandleSignals(conn, func(err error) {

			// this happens because we close the connection to redis when
			// we lose the http connection tot he client. But this piece of
			// code apparently still remains there int he air.
			if err != nil && strings.Contains(err.Error(), "use of closed network connection") {
				ctx.Abort()
			}

			ctx.CatchError(err)

			if time.Since(lastDump) > time.Second*1 {
				sendDump()
				lastDump = time.Now()
			}
		})
	})
}
