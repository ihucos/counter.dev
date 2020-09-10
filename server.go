package main

import (
	cryptoRand "crypto/rand"
	"crypto/sha256"
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
var db DB

type StatData map[string]map[string]int64
type LogData map[string]int64
type MetaData map[string]string
type TimedStatData struct {
	Day   StatData `json:"day"`
	Month StatData `json:"month"`
	Year  StatData `json:"year"`
	All   StatData `json:"all"`
}
type Data struct {
	Meta MetaData      `json:"meta"`
	Data TimedStatData `json:"data"`
	Log  LogData       `json:"log"`
}
type Visit map[string]string

var fieldsZet = []string{"lang", "origin", "ref", "loc"}
var fieldsHash = []string{"date", "weekday", "platform", "hour", "browser", "device", "country", "screen"}

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
	db = DB{pool}

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

func hash(stri string) string {
	h := sha256.Sum256([]byte(stri))
	return string(h[:])
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

	user := r.FormValue("site")
	if user == "" {
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

	dba := db.Open(user)
	defer dba.Close()

	dba.SaveVisit(now.Format("2006"), visit, 60*60*24*366)
	dba.SaveVisit(now.Format("2006-01"), visit, 60*60*24*31)
	dba.SaveVisit(now.Format("2006-01-02"), visit, 60*60*24)
	dba.SaveVisit("all", visit, -1)
	dba.SaveLogLine(logLine)

	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Cache-Control", "public, immutable")
	fmt.Fprint(w, "OK")

}

func Register(w http.ResponseWriter, r *http.Request) {
	user := truncate(r.FormValue("user"))
	password := r.FormValue("password")
	utcOffset := parseUTCOffset(r.FormValue("utcoffset"))
	if user == "" || password == "" {
		http.Error(w, "Missing Input", http.StatusBadRequest)
		return
	}

	if len(user) < 4 {
		http.Error(w, "User must have at least 4 charachters", http.StatusBadRequest)
		return
	}

	if len(password) < 8 {
		http.Error(w, "Password must have at least 8 charachters", http.StatusBadRequest)
		return
	}

	dba := db.Open(user)
	defer dba.Close()

	dba.redis.Send("MULTI")
	dba.redis.Send("HSETNX", "users", user, hash(password))
	dba.redis.Send("HSETNX", "tokens", user, randToken())
	userVarsStatus, err := redis.Ints(dba.redis.Do("EXEC"))
	if err != nil {
		log.Println(user, err)
		http.Error(w, err.Error(), 500)
		return
	}

	if userVarsStatus[0] == 0 {
		http.Error(w, "Username taken", http.StatusBadRequest)
	} else {
		dba.DelUserData()
		userData, err := dba.getData(utcOffset)
		if err != nil {
			log.Println(user, err)
			http.Error(w, err.Error(), 500)
			return
		}
		jsonString, err := json.Marshal(userData)
		if err != nil {
			log.Println(user, err)
			http.Error(w, err.Error(), 500)
			return
		}
		fmt.Fprintln(w, string(jsonString))
	}
}

func Dashboard(w http.ResponseWriter, r *http.Request) {
	user := r.FormValue("user")
	passwordInput := r.FormValue("password")
	utcOffset := parseUTCOffset(r.FormValue("utcoffset"))
	if user == "" || passwordInput == "" {
		http.Error(w, "Missing Input", http.StatusBadRequest)
		return
	}

	dba := db.Open(user)
	defer dba.Close()

	hashedPassword, _ := redis.String(dba.redis.Do("HGET", "users", user))
	token, _ := dba.ReadToken()

	if hashedPassword == hash(passwordInput) || (token != "" && token == passwordInput) {
		dba.redis.Send("HSET", "access", user, timeNow(0).Format("2006-01-02"))
		userData, err := dba.getData(utcOffset)
		if err != nil {
			log.Println(user, err)
			http.Error(w, err.Error(), 500)
			return
		}
		jsonString, err := json.Marshal(userData)
		if err != nil {
			log.Println(user, err)
			http.Error(w, err.Error(), 500)
			return
		}
		fmt.Fprintln(w, string(jsonString))
	} else {
		http.Error(w, "Wrong username or password", http.StatusBadRequest)
	}
}
