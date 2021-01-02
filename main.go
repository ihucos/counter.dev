package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"syscall"
	"time"

	"./config"
	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/sessions"
	"log"
)

type appAdapter struct {
	app *App
	fn  func(*Ctx)
}

func (ah appAdapter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	defer func() {
		r := recover()
		if r != nil {
			switch r.(type) {
			case *Ctx:
			default:
				panic(r)
			}
		}
	}()
	ctx := ah.app.NewContext(w, r)
	go func() {
		<-r.Context().Done()
		ctx.RunCleanup()
	}()
	ah.fn(ctx)
}

type App struct {
	RedisPool    *redis.Pool
	SessionStore *sessions.CookieStore
	Logger       *log.Logger
	ServeMux     *http.ServeMux
	config       config.Config
}

func (app *App) NewContext(w http.ResponseWriter, r *http.Request) *Ctx {
	return &Ctx{w: w, r: r, app: app}
}

func (app *App) CtxHandlerToHandler(fn func(*Ctx)) http.Handler {
	return appAdapter{app, fn}
}

func (app *App) Connect(path string, f func(*Ctx)) {
	app.ServeMux.Handle(path, app.CtxHandlerToHandler(f))
}

func (app *App) SetupUrls() {
	app.Connect("/login", func(ctx *Ctx) { ctx.handleLogin() })
	app.Connect("/logout", func(ctx *Ctx) { ctx.handleLogout() })
	app.Connect("/logout2", func(ctx *Ctx) { ctx.handleLogout2() })
	app.Connect("/deletetoken", func(ctx *Ctx) { ctx.HandleDeleteToken() })
	app.Connect("/resettoken", func(ctx *Ctx) { ctx.HandleResetToken() })
	app.Connect("/register", func(ctx *Ctx) { ctx.handleRegister() })
	app.Connect("/ping", func(ctx *Ctx) { ctx.handlePing() })
	app.Connect("/setPrefRange", func(ctx *Ctx) { ctx.handleSetPrefRange() })
	app.Connect("/setPrefSite", func(ctx *Ctx) { ctx.handleSetPrefSite() })
	app.Connect("/track", func(ctx *Ctx) { ctx.handleTrack() })
	app.Connect("/user", func(ctx *Ctx) { ctx.handleUser() })
	app.Connect("/dump", func(ctx *Ctx) { ctx.handleDump() })
	app.Connect("/count", func(ctx *Ctx) { ctx.Return(fmt.Sprintf("%d", ctx.app.RedisPool.ActiveCount()), 200) }) // DEBUG CODE
	app.Connect("/loadComponents.js", func(ctx *Ctx) { ctx.handleLoadComponentsJS() })
	app.Connect("/load.js", func(ctx *Ctx) { ctx.handleLoadComponentsJS2() })
}

func NewApp() *App {

	config := config.NewConfigFromEnv()

	redisPool := &redis.Pool{
		//MaxIdle:     0,
		//IdleTimeout: 240 * time.Second,
		//MaxActive: 10,
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

func (app App) Serve() {
	srv := &http.Server{
		Addr:         app.config.Bind,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
		Handler:      app.ServeMux,
	}
	err := srv.ListenAndServe()
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe: %s", err))
	}
}

func main() {

	// HOTFIX
	var rLimit syscall.Rlimit
	rLimit.Max = 100307
	rLimit.Cur = 100307
	err := syscall.Setrlimit(syscall.RLIMIT_NOFILE, &rLimit)
	if err != nil {
		fmt.Println("Error Setting Rlimit ", err)
	}

	app := NewApp()
	app.Logger.Println("Start")
	app.Serve()
}
