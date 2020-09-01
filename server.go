package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"encoding/base64"
	"math/rand"
	cryptoRand "crypto/rand"
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
)

var pool *redis.Pool

// set needs to overgrow sometimes so it does allow for "trending" new entries
// to catch up with older ones and replace them at some point.
const zetMaxSize = 30
const zetTrimEveryCalls = 100
const MaxRedisCahrs = 32
const truncateAt = 256

const loglinesKeep = 30

type jsonResponse struct {
  Data map[string]map[string]int64 `json:"data"`
  Meta map[string]string `json:"data"`
}

// taken from here at August 2020:
// https://gs.statcounter.com/screen-resolution-stats
var screenResolutions = map[string]bool{
	"1280x720":  true,
	"1280x800":  true,
	"1366x768":  true,
	"1440x900":  true,
	"1536x864":  true,
	"1600x900":  true,
	"1920x1080": true,
	"360x640":   true,
	"360x720":   true,
	"360x740":   true,
	"360x760":   true,
	"360x780":   true,
	"375x667":   true,
	"375x812":   true,
	"412x846":   true,
	"412x869":   true,
	"412x892":   true,
	"414x736":   true,
	"414x896":   true,
	"768x1024":  true}

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

func save(user string, data map[string]string, logLine string) {
	conn := pool.Get()
	defer conn.Close()
	for _, field := range fieldsZet {
		//val := strconv.FormatInt(time.Now().UnixNano(), 10)
		val := data[field]
		if val != "" {
			conn.Send("ZINCRBY", fmt.Sprintf("%s:%s", field, user), 1, truncate(val))
			if rand.Intn(zetTrimEveryCalls) == 0 {
				conn.Send("ZREMRANGEBYRANK", fmt.Sprintf("%s:%s", field, user), 0, -zetMaxSize)
			}
		}
	}

	for _, field := range fieldsHash {
		val := data[field]
		if val != "" {
			conn.Send("HINCRBY", fmt.Sprintf("%s:%s", field, user), truncate(val), 1)
		}
	}

	conn.Send("ZADD", fmt.Sprintf("log:%s", user), time.Now().Unix(), truncate(logLine))
	conn.Send("ZREMRANGEBYRANK", fmt.Sprintf("log:%s", user), 0, -loglinesKeep)

}

func delUserData(conn redis.Conn, user string) {
	for _, field := range fieldsZet {
		conn.Send("DEL", fmt.Sprintf("%s:%s", field, user))
	}
	for _, field := range fieldsHash {
		conn.Send("DEL", fmt.Sprintf("%s:%s", field, user))
	}
	conn.Send("DEL", fmt.Sprintf("log:%s", user))
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

func Track(w http.ResponseWriter, r *http.Request) {

	data := make(map[string]string)

	//
	// Input validation
	//

	user := r.FormValue("site")
	if user == "" {
		http.Error(w, "missing site param", http.StatusBadRequest)
		return
	}

	utcOffset, err := strconv.Atoi(r.FormValue("utcoffset"))
	if err != nil {
		utcOffset = 0
	}
	utcOffset = max(min(utcOffset, 11), -11)

	//
	// variables
	//
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
	// build data map
	//

	refParam := r.FormValue("referrer")
	parsedUrl, err := url.Parse(refParam)
	if err == nil && parsedUrl.Host != "" {
		data["ref"] = parsedUrl.Host
	}

	ref := r.Header.Get("Referer")
	parsedUrl, err = url.Parse(ref)
	if err == nil && parsedUrl.Path != "" {
		data["loc"] = parsedUrl.Path
	}

	tags, _, err := language.ParseAcceptLanguage(r.Header.Get("Accept-Language"))
	if err == nil && len(tags) > 0 {
		lang := display.English.Languages().Name(tags[0])
		data["lang"] = lang
	}

	if origin != "" && origin != "null" {
		data["origin"] = origin
	}

	country := r.Header.Get("CF-IPCountry")
	if country != "" && country != "XX" {
		data["country"] = strings.ToLower(country)
	}

	screenInput := r.FormValue("screen")
	if screenInput != "" {
		_, screenExists := screenResolutions[screenInput]
		if screenExists {
			data["screen"] = screenInput
		} else {
			data["screen"] = "Other"
		}
	}

	data["date"] = now.Format("2006-01-02")

	data["weekday"] = fmt.Sprintf("%d", now.Weekday())

	data["hour"] = fmt.Sprintf("%d", now.Hour())

	data["browser"] = ua.Browser.Name.StringTrimPrefix()

	data["device"] = ua.DeviceType.StringTrimPrefix()

	data["platform"] = ua.OS.Platform.StringTrimPrefix()

	//
	// save data map
	//
	logLine := fmt.Sprintf("[%s] %s %s %s", now.Format("2006-01-02 15:04:05"), country, refParam, userAgent)
	save(user, data, logLine)

	w.Header().Set("Content-Type", "text/plain")
	w.Header().Set("Cache-Control", "public, immutable")
	fmt.Fprint(w, "OK")

}

func Register(w http.ResponseWriter, r *http.Request) {
	conn := pool.Get()
	defer conn.Close()

	user := r.FormValue("user")
	password := r.FormValue("password")
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

        conn.Send("MULTI")
	conn.Send("HSETNX", "users", truncate(user), hash(password))
	conn.Send("HSETNX", "tokens", truncate(user), randToken())
        userVarsStatus, err := redis.Ints(conn.Do("EXEC"))
	if err != nil {
		log.Println(user, err)
		http.Error(w, err.Error(), 500)
		return
	}

	if userVarsStatus[0] == 0 {
		http.Error(w, "Username taken", http.StatusBadRequest)
	} else {
		delUserData(conn, user)
		userData, err := getData(conn, user)
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

func readToken(conn redis.Conn, user string) string{
	token, _ := redis.String(conn.Do("HGET", "tokens", truncate(user)))
        return base64.StdEncoding.EncodeToString([]byte(token))
}

func Dashboard(w http.ResponseWriter, r *http.Request) {
	conn := pool.Get()
	defer conn.Close()

	user := r.FormValue("user")
	passwordInput := r.FormValue("password")
	if user == "" || passwordInput == "" {
		http.Error(w, "Missing Input", http.StatusBadRequest)
		return
	}

	hashedPassword, _ := redis.String(conn.Do("HGET", "users", truncate(user)))
        token := readToken(conn, user)

	if hashedPassword == hash(passwordInput) || (token != "" && token == passwordInput){
		conn.Send("HSET", "access", user, timeNow(0).Format("2006-01-02"))
		userData, err := getData(conn, user)
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

return func getData(conn redis.Conn, user string) (map[string]map[string]int64, error) {

	var err error
	m := make(map[string]map[string]int64)

	for _, field := range fieldsZet {
		m[field], err = redis.Int64Map(conn.Do("ZRANGE", fmt.Sprintf("%s:%s", field, user), 0, -1, "WITHSCORES"))
		if err != nil {
			log.Println(user, err)
			return nil, err
		}
	}
	for _, field := range fieldsHash {
		m[field], err = redis.Int64Map(conn.Do("HGETALL", fmt.Sprintf("%s:%s", field, user)))
		if err != nil {
			log.Println(user, err)
			return nil, err
		}
	}

	m["log"], err = redis.Int64Map(conn.Do("ZRANGE", fmt.Sprintf("log:%s", user), 0, -1, "WITHSCORES"))
	if err != nil {
		log.Println(user, err)
		return nil, err
	}

	return m, err
}
