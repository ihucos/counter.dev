package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/avct/uasurfer"
	"github.com/gomodule/redigo/redis"
	"github.com/gorilla/sessions"
	"golang.org/x/text/language"
	"golang.org/x/text/language/display"
	"log"
	"runtime"
)

var pool *redis.Pool

// key must be 16, 24 or 32 bytes long (AES-128, AES-192 or AES-256)
var key = []byte("super-secret-key____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE_____NO_MERGE____NO_MERGE__")
var store = sessions.NewCookieStore(key)

type appHandler func(Ctx)

//type JSONResp struct {}
type Resp interface {
	GetResp() (string, int)
}

type AbortPanic struct{}

type Ctx struct {
	w     http.ResponseWriter
	r     *http.Request
	users Users
}

func (ctx Ctx) Abort() {
	panic(AbortPanic{})
}

func (ctx Ctx) Return(content string, statusCode int) {
	ctx.w.WriteHeader(statusCode)
	ctx.w.Write([]byte(content))
	ctx.Abort()
}

func (ctx Ctx) ReturnJSON(v interface{}, statusCode int) {
	jsonString, err := json.Marshal(v)
	ctx.HandleError(err)
	ctx.Return(string(jsonString), statusCode)
}

func (ctx Ctx) ReturnError(err error) {
	_, file, line, _ := runtime.Caller(1)
	fmt.Printf("%s:%d %s: %v\n", file, line, ctx.r.URL, err)
	ctx.Return(err.Error(), 500)
}

func (ctx Ctx) HandleError(err error) {
	if err != nil {
		ctx.ReturnError(err)
	}
}

func (ctx Ctx) SetSessionUser(userId string) {
	session, _ := store.Get(ctx.r, "swa")
	session.Values["user"] = userId
	session.Save(ctx.r, ctx.w)
}

func (ctx Ctx) ForceUserId() string {
	session, _ := store.Get(ctx.r, "swa")
	userId, ok := session.Values["user"].(string)
	if !ok {
		ctx.Return("Forbidden", http.StatusForbidden)
	}
	return userId
}

func (ctx Ctx) ReturnUserData(userId string) {
	user := ctx.users.New(userId)
	defer user.Close()

	utcOffset := parseUTCOffset(ctx.r.FormValue("utcoffset"))

	userData, err := user.GetData(utcOffset)
	ctx.HandleError(err)
	ctx.ReturnJSON(userData, 200)
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

func min(x, y int) int {
	if x < y {
		return x
	}
	return y
}

func max(x, y int) int {
	if x > y {
		return x
	}
	return y
}

func InitMux() *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)
	mux.Handle("/login", appHandler(Login))
	mux.Handle("/register", appHandler(Register))
	mux.Handle("/data", appHandler(AllData))
	mux.Handle("/track", appHandler(Track))
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

func parseUTCOffset(input string) int {
	utcOffset, err := strconv.Atoi(input)
	if err != nil {
		utcOffset = 0
	}
	return max(min(utcOffset, 14), -12)
}

func Track(ctx Ctx) {

	visit := make(Visit)

	//
	// Input validation
	//

	userId := ctx.r.FormValue("site")
	if userId == "" {
		ctx.Return("missing site param", 400)
	}

	//
	// variables
	//
	utcOffset := parseUTCOffset(ctx.r.FormValue("utcoffset"))
	now := timeNow(utcOffset)
	userAgent := ctx.r.Header.Get("User-Agent")
	ua := uasurfer.Parse(userAgent)
	origin := ctx.r.Header.Get("Origin")

	//
	// set expire
	//
	ctx.w.Header().Set("Expires", now.Format("Mon, 2 Jan 2006")+" 23:59:59 GMT")

	//
	// Not strictly necessary but avoids the browser issuing an error.
	//
	ctx.w.Header().Set("Access-Control-Allow-Origin", "*")

	//
	// drop if bot or origin is from localhost
	// see issue: https://github.com/avct/uasurfer/issues/65
	//
	if ua.IsBot() || strings.Contains(userAgent, " HeadlessChrome/") {
		return
	}
	originUrl, err := url.Parse(origin)
	if err == nil && (originUrl.Hostname() == "localhost" || originUrl.Hostname() == "127.0.0.1") {
		return
	}

	//
	// build visit map
	//

	refParam := ctx.r.FormValue("referrer")
	parsedUrl, err := url.Parse(refParam)
	if err == nil && parsedUrl.Host != "" {
		visit["ref"] = parsedUrl.Host
	}

	ref := ctx.r.Header.Get("Referer")
	parsedUrl, err = url.Parse(ref)
	if err == nil && parsedUrl.Path != "" {
		visit["loc"] = parsedUrl.Path
	}

	tags, _, err := language.ParseAcceptLanguage(ctx.r.Header.Get("Accept-Language"))
	if err == nil && len(tags) > 0 {
		lang := display.English.Languages().Name(tags[0])
		visit["lang"] = lang
	}

	if origin != "" && origin != "null" {
		visit["origin"] = origin
	}

	country := ctx.r.Header.Get("CF-IPCountry")
	if country != "" && country != "XX" {
		visit["country"] = strings.ToLower(country)
	}

	screenInput := ctx.r.FormValue("screen")
	if screenInput != "" {
		_, screenExists := screenResolutions[screenInput]
		if screenExists {
			visit["screen"] = screenInput
		} else {
			visit["screen"] = "Other"
		}
	}

	visit["date"] = now.Format("2006-01-02")

	visit["weekday"] = fmt.Sprintf("%d", now.Weekday())

	visit["hour"] = fmt.Sprintf("%d", now.Hour())

	visit["browser"] = ua.Browser.Name.StringTrimPrefix()

	visit["device"] = ua.DeviceType.StringTrimPrefix()

	visit["platform"] = ua.OS.Platform.StringTrimPrefix()

	//
	// save visit map
	//
	logLine := fmt.Sprintf("[%s] %s %s %s", now.Format("2006-01-02 15:04:05"), country, refParam, userAgent)

	user := ctx.users.New(userId)
	defer user.Close()
	user.SaveVisit(visit, now)
	user.SaveLogLine(logLine)

	ctx.w.Header().Set("Content-Type", "text/plain")
	ctx.w.Header().Set("Cache-Control", "public, immutable")
	ctx.Return("OK", 200)

}

func Register(ctx Ctx) {
	userId := truncate(ctx.r.FormValue("user"))
	password := ctx.r.FormValue("password")
	if userId == "" || password == "" {
		ctx.Return("Missing Input", 400)
	}

	user := ctx.users.New(userId)
	defer user.Close()

	err := user.Create(password)
	switch err.(type) {
	case nil:
		ctx.Return("OK", 200)

	case *ErrCreate:
		ctx.Return(err.Error(), 400)

	default:
		ctx.ReturnError(err)
	}
}

func Login(ctx Ctx) {

	userId := ctx.r.FormValue("user")
	passwordInput := ctx.r.FormValue("password")
	if userId == "" || passwordInput == "" {
		ctx.Return("Missing Input", 400)
	}

	user := ctx.users.New(userId)
	defer user.Close()

	passwordOk, err := user.VerifyPassword(passwordInput)
	ctx.HandleError(err)
	tokenOk, err := user.VerifyToken(passwordInput)
	ctx.HandleError(err)

	if passwordOk || tokenOk {
		user.TouchAccess()
		ctx.SetSessionUser(userId)
		ctx.ReturnUserData(userId)

	} else {
		ctx.Return("Wrong username or password", 400)
	}
}

func AllData(ctx Ctx) {
	ctx.ReturnUserData(ctx.ForceUserId())
}
