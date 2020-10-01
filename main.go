package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"./config"
	"./models"
	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/sessions"
	"log"
)

type appAdapter struct {
	app *App
	fn  func(Ctx)
}

func (ah appAdapter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer func() {
		r := recover()
		if r != nil {
			switch r.(type) {
			case Ctx:
			default:
				panic(r)
			}
		}
	}()
	ah.fn(ah.app.NewContext(w, r))
}

type App struct {
	RedisPool    *redis.Pool
	SessionStore *sessions.CookieStore
	Logger       *log.Logger
	ServeMux     *http.ServeMux
	config       config.Config
}

func (app *App) NewContext(w http.ResponseWriter, r *http.Request) Ctx {
	return Ctx{w: w, r: r, app: app}
}

func (app *App) CtxHandlerToHandler(fn func(Ctx)) http.Handler {
	return appAdapter{app, fn}
}

func (app *App) OpenUser(userId string) models.User {
	return models.NewUser(app.RedisPool.Get(), userId)
}

func (app *App) Connect(path string, f func(Ctx)) {
	app.ServeMux.Handle(path, app.CtxHandlerToHandler(f))
}

func (app *App) SetupUrls() {
	app.Connect("/login", func(ctx Ctx) { ctx.handleLogin() })
	app.Connect("/logout", func(ctx Ctx) { ctx.handleLogout() })
	app.Connect("/register", func(ctx Ctx) { ctx.handleRegister() })
	app.Connect("/ping", func(ctx Ctx) { ctx.handlePing() })
	app.Connect("/setPrefRange", func(ctx Ctx) { ctx.handleSetPrefRange() })
	app.Connect("/track", func(ctx Ctx) { ctx.handleTrack() })
	app.Connect("/user", func(ctx Ctx) { ctx.handleUser() })
}

func NewApp() *App {

	config := config.NewConfigFromEnv()

	redisPool := &redis.Pool{
		MaxIdle:     10,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			return redis.DialURL(config.RedisUrl)
		},
	}

	sessionStore := sessions.NewCookieStore(config.CookieSecret)

	logFile, err := os.OpenFile("log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0744)
	if err != nil {
		panic(fmt.Sprintf("error opening file: %v", err))
	}
	logger := log.New(io.MultiWriter(os.Stdout, logFile), "", log.LstdFlags|log.Lshortfile)

	serveMux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./static"))
	serveMux.Handle("/", fs)

	app := &App{
		RedisPool:    redisPool,
		SessionStore: sessionStore,
		Logger:       logger,
		ServeMux:     serveMux,
		config:       config,
	}
	app.SetupUrls()
	return app
}

func main() {
	app := NewApp()
	app.Logger.Println("Start")
	err := http.ListenAndServe(app.config.Bind, app.ServeMux)
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe: %s", err))
	}

}
