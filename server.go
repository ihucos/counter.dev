package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/sessions"
	"log"
)

type AbortPanic struct{}

type Ctx struct {
	w   http.ResponseWriter
	r   *http.Request
	app *App
}

type AppHandler struct {
	app *App
	fn  func(Ctx)
}

func (ah AppHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer func() {
		r := recover()
		if r != nil {
			switch r.(type) {
			case AbortPanic:
			default:
				panic(r)
			}
		}
	}()
	ah.fn(ah.app.Context(w, r))
}


type App struct {
	RedisPool    *redis.Pool
	users        *Users
	SessionStore *sessions.CookieStore
	Logger       *log.Logger
	ServeMux     *http.ServeMux
}

func (app App) Serve(bind string) {
	err := http.ListenAndServe(bind, app.ServeMux)
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe: ", err))
	}
}

func (app *App) Init() {
	for path, f := range Handlers {
		app.ServeMux.Handle(path, app.CtxHandlerToHandler(f))
	}
}

func (app *App) Context(w http.ResponseWriter, r *http.Request) Ctx {
	return Ctx{w: w, r: r, app: app}
}

func (app *App) CtxHandlerToHandler(fn func(Ctx)) http.Handler {
	return AppHandler{app, fn}
}

func NewApp() *App {
	redisPool := SetupRedisPool()
	app := &App{
		RedisPool:    redisPool,
		users:        &Users{redisPool},
		SessionStore: SetupSessionStore(),
		Logger:       SetupLogger(),
		ServeMux:     SetupServeMux(),
	}
	app.Init()
	return app
}

func timeNow(utcOffset int) time.Time {
	location, err := time.LoadLocation("UTC")
	if err != nil {
		panic(err)
	}

	utcnow := time.Now().In(location)
	now := utcnow.Add(time.Hour * time.Duration(utcOffset))
	return now

}

func main() {
	log.Println("Start")
	NewApp().Serve(":80")
}
