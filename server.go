package main

import (
	"io"
	"net/http"
	"os"
	"time"

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

func (app App) SetupSessionStore() *sessions.CookieStore {
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
		logger.Fatalf("error opening file: %v", err)
		return
	}
	logger := log.New(io.MultiWriter(os.Stdout, logFile), "webstats", log.LstdFlags|log.Lshortfile)
	defer logFile.Close()
	return logger
}

func (app App) Serve(bind string) {
	err = http.ListenAndServe(bind, App.Mux)
	if err != nil {
		app.logger.Fatal("ListenAndServe: ", err)
	}
}

func NewApp() *App {
	return &App{
		RedisPool:    SetupRedisPool(),
		SessionStore: SetupServeMux(),
		Logger:       SetupLogger(),
		ServeMux:     SetupServeMux(),
	}
}

func (fn appHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	users := Users{pool}
	ctx := Ctx{w: w, r: r, users: users}
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
