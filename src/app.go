package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/sessions"
	"log"
	"../models"
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
	config       Config
}

func (app App) Serve() {
	err := http.ListenAndServe(app.config.Bind, app.ServeMux)
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe: %s", err))
	}
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

func NewApp() *App {

	config := NewConfig()

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

	for path, f := range Endpoints {
		serveMux.Handle(path, app.CtxHandlerToHandler(f))
	}
	return app

}
