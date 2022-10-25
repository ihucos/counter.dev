package endpoints

import (
	"strings"
	"time"

	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/utils"
	"github.com/ihucos/counter.dev/lib"
	"github.com/ihucos/counter.dev/models"
)

type UserDump struct {
	Id    string            `json:"id"`
	Token string            `json:"token"`
	UUID string            `json:"uuid"`
	IsSubscribed bool `json:"isSubscribed"`
	Prefs map[string]string `json:"prefs"`
}

type SitesDumpVal struct {
	Count  int                `json:"count"`
	Logs   models.LogData     `json:"logs"`
	Visits models.TimedVisits `json:"visits"`
}

type SitesDump map[string]SitesDumpVal
type Meta map[string]string

type Dump struct {
	Sites SitesDump         `json:"sites"`
	User  UserDump          `json:"user"`
	Meta  map[string]string `json:"meta"`
}

type EventSourceData struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func LoadSitesDump(user models.User, utcOffset int) (SitesDump, error) {
	sitesDump := make(SitesDump)

	sitesLink, err := user.GetPreferredSiteLinks()
	if err != nil {
		return SitesDump{}, err
	}

	for siteId, count := range sitesLink {
		site := user.NewSite(siteId)
		logs, err := site.GetLogs()
		if err != nil {
			return SitesDump{}, err
		}
		visits, err := site.GetVisits(utcOffset)
		if err != nil {
			return SitesDump{}, err
		}
		sitesDump[siteId] = SitesDumpVal{
			Logs:   logs,
			Visits: visits,
			Count:  count,
		}
	}
	return sitesDump, nil
}

func LoadUserDump(user models.User) (UserDump, error) {
	prefsData, err := user.GetPrefs()
	if err != nil {
		return UserDump{}, err
	}
	token, err := user.ReadToken()
	if err != nil {
		return UserDump{}, err
	}
	uuid, err := user.ReadUUID()
	if err != nil {
		return UserDump{}, err
	}
	subscriptionId, err := user.ReadSubscriptionID()
	if err != nil {
		return UserDump{}, err
	}
	return UserDump{Id: user.Id, Token: token, UUID: uuid, Prefs: prefsData, IsSubscribed: subscriptionId != ""}, nil
}

func LoadDump(user models.User, utcOffset int) (Dump, error) {

	sitesDump, err := LoadSitesDump(user, utcOffset)
	if err != nil {
		return Dump{}, err
	}

	userDump, err := LoadUserDump(user)
	if err != nil {
		return Dump{}, err
	}
	return Dump{User: userDump, Sites: sitesDump, Meta: Meta{}}, nil
}

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		ctx.W.Header().Set("Content-Type", "text/event-stream")
		ctx.W.Header().Set("Cache-Control", "no-cache")
		ctx.W.Header().Set("Connection", "keep-alive")

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
			ctx.SendEventSourceData(EventSourceData{
				Type:    "nouser",
				Payload: nil})
			return
		}

		user.TouchDump()

		archive := make(map[string]lib.QueryArchiveResult) 
		now := utils.TimeNow(utcOffset)
		var err error

		archive["-7:-2"], err = ctx.App.QueryArchive(lib.QueryArchiveArgs{
			User:     user.Id,
			DateFrom: now.AddDate(0, 0, -7),
			DateTo:   now.AddDate(0, 0, -2),
		})
		ctx.CatchError(err)

		archive["-30:-2"], err = ctx.App.QueryArchive(lib.QueryArchiveArgs{
			User:     user.Id,
			DateFrom: now.AddDate(0, 0, -30),
			DateTo:   now.AddDate(0, 0, -2),
		})
		ctx.CatchError(err)

		oldestArchiveDate, err := ctx.App.QueryArchiveOldestDate(user.Id)
		ctx.CatchError(err)


		ctx.SendEventSourceData(EventSourceData{
			Type:    "oldest-archive-date",
			Payload: oldestArchiveDate})

		ctx.SendEventSourceData(EventSourceData{
			Type:    "archive",
			Payload: archive})

		sendDump := func() {
			dump, err := LoadDump(user, utcOffset)
			ctx.CatchError(err)
			dump.Meta = meta
			ctx.SendEventSourceData(EventSourceData{
				Type:    "dump",
				Payload: dump})
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
