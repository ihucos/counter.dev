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

// key must be 16, 24 or 32 bytes long (AES-128, AES-192 or AES-256)
var key = []byte("super-secret-key____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE____NO_MERGE__")
var store = sessions.NewCookieStore(key)

type appHandler func(Ctx)

type AbortPanic struct{}

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

func InitMux() *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)
	mux.Handle("/login", appHandler(func(ctx Ctx) { ctx.ReturnLoginPage() }))
	mux.Handle("/register", appHandler(func(ctx Ctx) { ctx.ReturnRegisterPage() }))
	mux.Handle("/data", appHandler(func(ctx Ctx) { ctx.ReturnDataPage() }))
	mux.Handle("/track", appHandler(func(ctx Ctx) { ctx.ReturnTrackingPage() }))

	return mux

}

func main() {

	log.SetFlags(log.LstdFlags | log.Lshortfile)
	logFile, err := os.OpenFile("log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0744)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
		return
	}
	defer logFile.Close()
	log.SetOutput(io.MultiWriter(os.Stdout, logFile))

	pool = &redis.Pool{
		MaxIdle:     10,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", "localhost:6379")
		},
	}

	log.Println("Start")
	err = http.ListenAndServe(":80", InitMux())
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
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
