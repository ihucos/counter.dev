package main

import (
	"io"
	"net/http"
	"os"
	"time"
	"fmt"

	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/sessions"
	"log"
)

var pool *redis.Pool

type Ctx struct {
	w   http.ResponseWriter
	r   *http.Request
	app *App
}

type appHandler func(Ctx)

type AbortPanic struct{}

type App struct {
	RedisPool    *redis.Pool
        users        *Users
	SessionStore *sessions.CookieStore
	Logger       *log.Logger
	ServeMux     *http.ServeMux
}

func SetupRedisPool() *redis.Pool {
	return &redis.Pool{
		MaxIdle:     10,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", "localhost:6379")
		},
	}
}

func SetupSessionStore() *sessions.CookieStore {
	// key must be 16, 24 or 32 bytes long (AES-128, AES-192 or AES-256)
	var key = []byte("super-secret-key____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE____NO_MERGE__")
	return sessions.NewCookieStore(key)
}

func SetupServeMux() *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)
	for path, f := range Handlers {
		mux.Handle(path, appHandler(f))
	}

	return mux
}

func SetupLogger() *log.Logger {
	logFile, err := os.OpenFile("log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0744)
	if err != nil {
		panic(fmt.Sprintf("error opening file: %v", err))
	}
	logger := log.New(io.MultiWriter(os.Stdout, logFile), "webstats", log.LstdFlags|log.Lshortfile)
	return logger
}

func (app App) Serve(bind string) {
	err := http.ListenAndServe(bind, app.ServeMux)
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe: ", err))
	}
}

func NewApp() *App {
        redisPool := SetupRedisPool()
	return &App{
		RedisPool:    redisPool,
                users:        &Users{redisPool},
		SessionStore: SetupSessionStore(),
		Logger:       SetupLogger(),
		ServeMux:     SetupServeMux(),
	}
}

func (fn appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := Ctx{w: w, r: r, app: NewApp()} // CANT CRTE APP CONTEXT ALL THE TIME!!!!!!!
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
	fn(ctx)
}

func main() {
	log.Println("Start")
        NewApp().Serve(":80")
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
