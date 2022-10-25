package lib

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"runtime"
	"strconv"

	"github.com/ihucos/counter.dev/models"
	"github.com/ihucos/counter.dev/utils"
)

type UserDataResp struct {
	Meta      models.MetaData `json:"meta"`
	Prefs     models.MetaData `json:"prefs"`
	SiteLinks map[string]int  `json:"site_links"`
}

type Ctx struct {
	W         http.ResponseWriter
	R         *http.Request
	OpenConns []io.Closer
	App       *App
	noAutoCleanup bool
}

func (ctx *Ctx) Abort() {
	panic(ctx)
}

func (ctx *Ctx) Return(content string, statusCode int) {
	ctx.W.WriteHeader(statusCode)
	ctx.W.Write([]byte(content))
	ctx.Abort()
}

func (ctx *Ctx) Cleanup() {
	for _, conn := range ctx.OpenConns {
		err := conn.Close()
		if err != nil {
			fmt.Println("Error closing connection:", err.Error())
		}
	}
}

func (ctx *Ctx) ReturnBadRequest(message string) {
	ctx.Return(message, 400)
}

func (ctx *Ctx) ReturnJSON(v interface{}, statusCode int) {
	jsonString, err := json.Marshal(v)
	ctx.CatchError(err)
	ctx.Return(string(jsonString), statusCode)
}

func (ctx *Ctx) ReturnInternalErrorWithSkip(err error, skip int) {
	_, file, line, _ := runtime.Caller(skip)
	ctx.App.Logger.Printf("%s:%d %s: %v\n", file, line, ctx.R.URL, err)
	ctx.Return(err.Error(), 500)
}

func (ctx *Ctx) ReturnInternalError(err error) {
	ctx.ReturnInternalErrorWithSkip(err, 2)
}

func (ctx *Ctx) CatchError(err error) {
	if err != nil {
		ctx.ReturnInternalErrorWithSkip(err, 2)
	}
}

func (ctx *Ctx) ReturnUser() {
	user := ctx.ForceUser()
	metaData, err := user.GetMetaData()
	ctx.CatchError(err)
	prefsData, err := user.GetPrefs()
	ctx.CatchError(err)
	SiteLinksData, err := user.GetPreferredSiteLinks()
	ctx.CatchError(err)
	data := UserDataResp{Meta: metaData, Prefs: prefsData, SiteLinks: SiteLinksData}
	ctx.ReturnJSON(data, 200)
}

func (ctx *Ctx) GetPref(key string) string {
	val, err := ctx.ForceUser().GetPref(key)
	if err != nil {
		ctx.CatchError(err)
	}
	return val
}

func (ctx *Ctx) SetPref(key string, value string) {
	err := ctx.ForceUser().SetPref(key, value)
	if err != nil {
		ctx.CatchError(err)
	}
}

func (ctx *Ctx) ParseUTCOffset(key string) int {

	min := func(x, y int) int {
		if x < y {
			return x
		}
		return y
	}

	max := func(x, y int) int {
		if x > y {
			return x
		}
		return y
	}

	utcOffset, err := strconv.Atoi(ctx.R.FormValue(key))
	if err != nil {
		utcOffset = 0
	}
	return max(min(utcOffset, 14), -12)
}

func (ctx *Ctx) SetSessionUser(userId string) {
	session, _ := ctx.App.SessionStore.Get(ctx.R, "swa")
	session.Values["user"] = userId
	session.Save(ctx.R, ctx.W)
}

func (ctx *Ctx) ForceUserId() string {
	userId := ctx.GetUserId()
	if userId == "" {
		ctx.Return("Forbidden", 403)
	}
	return userId
}

func (ctx *Ctx) GetUserId() string {
	session, _ := ctx.App.SessionStore.Get(ctx.R, "swa")
	userId, ok := session.Values["user"].(string)
	if !ok {
		return ""
	}
	return userId
}

func (ctx *Ctx) GetSessionlessUserId() string {
	shareUser := ctx.R.FormValue("user")
	shareToken := ctx.R.FormValue("token")
	var user models.User
	if shareUser != "" && shareToken != "" {
		user = ctx.User(shareUser)
		tokenValid, err := user.VerifyToken(shareToken)
		ctx.CatchError(err)
		if tokenValid {
			return shareUser
		}
	}
	return ""
}

func (ctx *Ctx) Logout() {
	session, _ := ctx.App.SessionStore.Get(ctx.R, "swa")
	session.Options.MaxAge = -1
	session.Save(ctx.R, ctx.W)
}

func (ctx *Ctx) User(userId string) models.User {
	conn := ctx.App.RedisPool.Get()
	user := models.NewUser(conn, userId, ctx.App.DB, ctx.App.Config.PasswordSalt)
	ctx.OpenConns = append(ctx.OpenConns, conn)
	return user
}

func (ctx *Ctx) UserByCachedUUID(uuid string) models.User {
	conn := ctx.App.RedisPool.Get()
	user, err := models.NewUserByCachedUUID(conn, uuid, ctx.App.DB, ctx.App.Config.PasswordSalt)
	ctx.CatchError(err)
	ctx.OpenConns = append(ctx.OpenConns, conn)
	return user
}

func (ctx *Ctx) LogEvent(eventType string) {
	conn := ctx.App.RedisPool.Get()
	now := utils.TimeNow(1) // one is the coolest time zone.
	conn.Send("HINCRBY", fmt.Sprintf("logevent:%s", eventType), now.Format("2006-01-02"), "1")
	conn.Close()
}

func (ctx *Ctx) ForceUser() models.User {
	return ctx.User(ctx.ForceUserId())

}

func (ctx *Ctx) CheckMethod(methods ...string) {

	found := false
	for _, method := range methods {
		if ctx.R.Method == method {
			found = true
		}
	}
	if !found {
		ctx.Return("Method Not Allowed", 405)
	}
}


func (ctx *Ctx) SendEventSourceData(data interface{}) {
	jsonBin, err := json.Marshal(data)
	ctx.CatchError(err)
	fmt.Fprintf(ctx.W, "data: %s\n\n", string(jsonBin))
	f, ok := ctx.W.(http.Flusher)
	if !ok {
		panic("Flush not supported by library")
	}
	f.Flush()
}


func (ctx *Ctx) NoAutoCleanup() {
	ctx.noAutoCleanup = true
}
