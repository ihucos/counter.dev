package lib

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"log"

	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/sessions"
)

type appAdapter struct {
	App *App
	fn  func(*Ctx)
}

var endpoints = map[string]func(*Ctx){}

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
	ctx := ah.App.NewContext(w, r)
	go func() {
		<-r.Context().Done()
		ctx.RunCleanup()
	}()
	ah.fn(ctx)
}

func Endpoint(endpoint string, f func(*Ctx)) {
	endpoints[endpoint] = f
}

func EndpointName() string {
	_, fpath, _, ok := runtime.Caller(1)
	if !ok {
		err := errors.New("failed to get filename")
		panic(err)
	}
	filename := filepath.Base(fpath)
	return "/" + strings.TrimSuffix(filename, filepath.Ext(filename))
}

type App struct {
	RedisPool    *redis.Pool
	SessionStore *sessions.CookieStore
	Logger       *log.Logger
	ServeMux     *http.ServeMux
	Config       Config
}

func (app *App) ConnectEndpoints() {
	for endpoint, handler := range endpoints {
		app.Connect(endpoint, handler)
	}
}

func (app *App) NewContext(w http.ResponseWriter, r *http.Request) *Ctx {
	return &Ctx{W: w, R: r, App: app}
}

func (app *App) CtxHandlerToHandler(fn func(*Ctx)) http.Handler {
	return appAdapter{app, fn}
}

func (app *App) Connect(path string, f func(*Ctx)) {
	app.ServeMux.Handle(path, app.CtxHandlerToHandler(f))
}

func NewApp() *App {

	config := NewConfigFromEnv()

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

	fs = http.FileServer(http.Dir("./out/pages"))
	serveMux.Handle("/pages/", http.StripPrefix("/pages/", fs))

	fs = http.FileServer(http.Dir("./out/blog"))
	serveMux.Handle("/blog/", http.StripPrefix("/blog/", fs))

	app := &App{
		RedisPool:    redisPool,
		SessionStore: sessionStore,
		Logger:       logger,
		ServeMux:     serveMux,
		Config:       config,
	}
	return app
}

type Mux struct {
	staging, main *http.ServeMux
}

func (mux *Mux) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	domainParts := strings.Split(r.Host, ".")
	//panic(domainParts[0])
	if domainParts[0] == "staging" {
		mux.staging.ServeHTTP(w, r)
		return
	}
	mux.main.ServeHTTP(w, r)
}

func (app App) Serve() {

	mux := &Mux{
		staging: http.NewServeMux(),
		main:    app.ServeMux,
	}

	fs := http.FileServer(http.Dir("./staging/static"))
	mux.staging.Handle("/", fs)

	fs = http.FileServer(http.Dir("./staging/out/pages"))
	mux.staging.Handle("/pages/", http.StripPrefix("/pages/", fs))

	fs = http.FileServer(http.Dir("./staging/out/blog"))
	mux.staging.Handle("/blog/", http.StripPrefix("/blog/", fs))

	srv := &http.Server{
		Addr:        app.Config.Bind,
		ReadTimeout: 5 * time.Second,

		// we cant have write a write timeout because of the streaming response
		WriteTimeout: 0,

		IdleTimeout: 120 * time.Second,
		Handler:     mux,
	}
	fmt.Println("Listening at", app.Config.Bind)
	err := srv.ListenAndServe()
	if err != nil {
		panic(fmt.Sprintf("ListenAndServe: %s", err))
	}
}
