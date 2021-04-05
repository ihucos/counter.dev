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

	"github.com/syndtr/goleveldb/leveldb"

	"encoding/gob"
	"bytes"
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
	Leveldb *leveldb.DB
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
	app.Connect("/login", func(ctx *Ctx) { ctx.HandleLogin() })
	app.Connect("/logout", func(ctx *Ctx) { ctx.handleLogout() })
	app.Connect("/deletetoken", func(ctx *Ctx) { ctx.HandleDeleteToken() })
	app.Connect("/resettoken", func(ctx *Ctx) { ctx.HandleResetToken() })
	app.Connect("/deletesite", func(ctx *Ctx) { ctx.HandleDeleteSite() })
	app.Connect("/dashboard", func(ctx *Ctx) { ctx.HandleDashboard() })
	app.Connect("/register", func(ctx *Ctx) { ctx.handleRegister() })
	app.Connect("/setPrefRange", func(ctx *Ctx) { ctx.handleSetPrefRange() })
	app.Connect("/setPrefSite", func(ctx *Ctx) { ctx.handleSetPrefSite() })
	app.Connect("/track", func(ctx *Ctx) { ctx.handleTrack() })
	app.Connect("/accountedit", func(ctx *Ctx) { ctx.handleAccountEdit() })
	app.Connect("/user", func(ctx *Ctx) { ctx.handleUser() })
	app.Connect("/dump", func(ctx *Ctx) { ctx.handleDump() })
	app.Connect("/deleteUser", func(ctx *Ctx) { ctx.handleDeleteUser() })
	app.Connect("/count", func(ctx *Ctx) { ctx.Return(fmt.Sprintf("%d", ctx.app.RedisPool.ActiveCount()), 200) }) // DEBUG CODE
	app.Connect("/load.js", func(ctx *Ctx) { ctx.handleLoadComponentsJS() })
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

	leveldb, err := leveldb.OpenFile("/tmp/my.db", nil)
	if err != nil {
		panic(err)
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
		Leveldb:      leveldb,
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
		Addr:        app.config.Bind,
		ReadTimeout: 5 * time.Second,

		// we cant have write a write timeout because of the streaming response
		WriteTimeout: 0,

		IdleTimeout: 120 * time.Second,
		Handler:     app.ServeMux,
	}
	err := srv.ListenAndServe()
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe: %s", err))
	}
}

func archiveRedisKeys(app *App) {
	conn := app.RedisPool.Get()
	iter := 0
	var keys []string
	for {
		arr, err := redis.Values(conn.Do("SCAN", iter, "MATCH", "v:*", "COUNT", "1000")); 
		if err != nil {
			panic(err)
		}
		iter, err = redis.Int(arr[0], nil)
		if err != nil {
			panic(err)
		}
		keys, err = redis.Strings(arr[1], nil)
		if err != nil {
			panic(err)
		}

		for _, key := range keys {
			conn.Send("TYPE", key)
		}
		conn.Flush()

		for _, key := range keys {
			key_type, err := redis.String(conn.Receive())
			if err != nil {
				panic(err)
			}
			if key_type == "zset" {
				conn.Send("ZRANGE", key, "0", "-1", "WITHSCORES")
			} else if key_type == "hash" {
				conn.Send("HGETALL", key)
			} else {
				panic("bad key type: " + key_type)
			}
		}
		conn.Flush()


			for _, key := range keys {
				key_val, err := redis.Int64Map(conn.Receive())
				if err != nil {
					panic(err)
				}
				// fmt.Println(key, key_val)

				buf := new(bytes.Buffer)
				enc := gob.NewEncoder(buf)
				err = enc.Encode(&key_val)
				if err != nil {
					panic(err)
				}

				//fmt.Println(key, buf.Bytes())

				app.Leveldb.Put([]byte(key), buf.Bytes(), nil)
			}

		if iter == 0 {break}

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

	go archiveRedisKeys(app)

	app.Logger.Println("Start")
	app.Serve()
}
