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
)

type AbortPanic struct{}

type Ctx struct {
	w   http.ResponseWriter
	r   *http.Request
	app *App
}

type appAdapter struct {
	app *App
	fn  func(Ctx)
}

func (ah appAdapter) ServeHTTP(w http.ResponseWriter, r *http.Request) {
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
	ah.fn(ah.app.NewContext(w, r))
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

func (app *App) NewContext(w http.ResponseWriter, r *http.Request) Ctx {
	return Ctx{w: w, r: r, app: app}
}

func (app *App) CtxHandlerToHandler(fn func(Ctx)) http.Handler {
	return appAdapter{app, fn}
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

func NewApp() *App {

	redisPool := &redis.Pool{
		MaxIdle:     10,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", "localhost:6379")
		},
	}

	var key = []byte("super-secret-key____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE____NO_MERGE__")
	sessionStore := sessions.NewCookieStore(key)

	logFile, err := os.OpenFile("log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0744)
	if err != nil {
		panic(fmt.Sprintf("error opening file: %v", err))
	}
	logger := log.New(io.MultiWriter(os.Stdout, logFile), "webstats", log.LstdFlags|log.Lshortfile)

	serveMux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./static"))
	serveMux.Handle("/", fs)

	app := &App{
		RedisPool:    redisPool,
		users:        &Users{redisPool},
		SessionStore: sessionStore,
		Logger:       logger,
		ServeMux:     serveMux,
	}

	for path, f := range Handlers {
		serveMux.Handle(path, app.CtxHandlerToHandler(f))
	}
	return app

}
