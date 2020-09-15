package main

import (
	cryptoRand "crypto/rand"
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
	"golang.org/x/text/language"
	"golang.org/x/text/language/display"
	"log"
)

var pool *redis.Pool
var users Users

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
	users = Users{pool}

	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("./static"))
	mux.Handle("/", fs)
	mux.HandleFunc("/track", Track)
	mux.HandleFunc("/register", Register)
	mux.HandleFunc("/dashboard", Dashboard)

	log.Println("Start")
	err = http.ListenAndServe(":80", mux)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func randToken() string {
	raw := make([]byte, 512)
	cryptoRand.Read(raw)
	return hash(string(raw))
}

func truncate(stri string) string {
	if len(stri) > truncateAt {
		return stri[:truncateAt]
	}
	return stri
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

func Track(w http.ResponseWriter, r *http.Request) {

	visit := make(Visit)

	//
	// Input validation
	//

	userId := r.FormValue("site")
	if userId == "" {
		http.Error(w, "missing site param", http.StatusBadRequest)
		return
	}

	//
	// variables
	//
	utcOffset := parseUTCOffset(r.FormValue("utcoffset"))
	now := timeNow(utcOffset)
	userAgent := r.Header.Get("User-Agent")
	ua := uasurfer.Parse(userAgent)
	origin := r.Header.Get("Origin")

	//
	// set expire
	//
	w.Header().Set("Expires", now.Format("Mon, 2 Jan 2006")+" 23:59:59 GMT")

	//
	// Not strictly necessary but avoids the browser issuing an error.
	//
	w.Header().Set("Access-Control-Allow-Origin", "*")

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

	refParam := r.FormValue("referrer")
	parsedUrl, err := url.Parse(refParam)
	if err == nil && parsedUrl.Host != "" {
		visit["ref"] = parsedUrl.Host
	}

	ref := r.Header.Get("Referer")
	parsedUrl, err = url.Parse(ref)
	if err == nil && parsedUrl.Path != "" {
		visit["loc"] = parsedUrl.Path
	}

	tags, _, err := language.ParseAcceptLanguage(r.Header.Get("Accept-Language"))
	if err == nil && len(tags) > 0 {
		lang := display.English.Languages().Name(tags[0])
		visit["lang"] = lang
	}

	if origin != "" && origin != "null" {
		visit["origin"] = origin
	}

	country := r.Header.Get("CF-IPCountry")
	if country != "" && country != "XX" {
		visit["country"] = strings.ToLower(country)
	}

	screenInput := r.FormValue("screen")
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

	user := users.New(userId)
	defer user.Close()
	user.SaveVisit(visit, now)
	user.SaveLogLine(logLine)

	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Cache-Control", "public, immutable")
	fmt.Fprint(w, "OK")

}

func Register(w http.ResponseWriter, r *http.Request) {
	userId := truncate(r.FormValue("user"))
	password := r.FormValue("password")
	utcOffset := parseUTCOffset(r.FormValue("utcoffset"))
	if userId == "" || password == "" {
		http.Error(w, "Missing Input", http.StatusBadRequest)
		return
	}

	user := users.New(userId)
	defer user.Close()

	err := user.Create(password)
	switch err.(type) {
	case nil:
		userData, err := user.getData(utcOffset)
		if err != nil {
			log.Println(userId, err)
			http.Error(w, err.Error(), 500)
			return
		}
		jsonString, err := json.Marshal(userData)
		if err != nil {
			log.Println(userId, err)
			http.Error(w, err.Error(), 500)
			return
		}
		fmt.Fprintln(w, string(jsonString))

	case *ErrCreate:
		http.Error(w, err.Error(), 400)
		return

	default:
		log.Println(userId, err)
		http.Error(w, err.Error(), 500)
		return
	}
}

func Dashboard(w http.ResponseWriter, r *http.Request) {
	userId := r.FormValue("user")
	passwordInput := r.FormValue("password")
	utcOffset := parseUTCOffset(r.FormValue("utcoffset"))
	if userId == "" || passwordInput == "" {
		http.Error(w, "Missing Input", http.StatusBadRequest)
		return
	}

	user := users.New(userId)
	defer user.Close()

	passwordOk, err := user.VerifyPassword(passwordInput)
	if err != nil {
		log.Println(userId, err)
		http.Error(w, err.Error(), 500)
		return
	}
	tokenOk, err := user.VerifyToken(passwordInput)
	if err != nil {
		log.Println(userId, err)
		http.Error(w, err.Error(), 500)
		return
	}

	if passwordOk || tokenOk {
		user.TouchAccess()
		userData, err := user.getData(utcOffset)
		if err != nil {
			log.Println(userId, err)
			http.Error(w, err.Error(), 500)
			return
		}
		jsonString, err := json.Marshal(userData)
		if err != nil {
			log.Println(userId, err)
			http.Error(w, err.Error(), 500)
			return
		}
		fmt.Fprintln(w, string(jsonString))
	} else {
		http.Error(w, "Wrong username or password", http.StatusBadRequest)
	}
}
