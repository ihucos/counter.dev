package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"strconv"
	"time"
	"os"
	"strings"

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
const truncateAt = 128

const loglinesKeep = 30

var fieldsZet = []string{"lang", "origin", "ref", "loc"}
var fieldsHash = []string{"date", "weekday", "platform", "hour", "browser", "device", "country"}

func main() {

	log.SetFlags(log.LstdFlags | log.Lshortfile)
        f, err := os.OpenFile("log", os.O_RDWR | os.O_CREATE | os.O_APPEND, 0744)
        if err != nil {
            log.Fatalf("error opening file: %v", err)
            return
        }
        defer f.Close()
        log.SetOutput(f)

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
        err = http.ListenAndServeTLS(":443", "keys/server.crt", "keys/server.key", mux)
        if err != nil {
            log.Fatal("ListenAndServe: ", err)
        }
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

func Track(w http.ResponseWriter, r *http.Request) {

	data := make(map[string]string)

	user := r.FormValue("site")
	if user == "" {
		http.Error(w, "missing uid", http.StatusBadRequest)
		return
	}

	utcoffset, err := strconv.Atoi(r.FormValue("utcoffset"))
	if err != nil {
		utcoffset = 0
	}

	location, err := time.LoadLocation("UTC")
	if err != nil {
		panic(err)
	}

	utcnow := time.Now().In(location)
	now := utcnow.Add(time.Hour * time.Duration(utcoffset))
	w.Header().Set("Expires", now.Format("Mon, 2 Jan 2006")+" 23:59:59 GMT")

	ref := r.FormValue("referrer")
	parsedUrl, err := url.Parse(ref)
	if err == nil && parsedUrl.Host != "" {
		data["ref"] = parsedUrl.Host
	}

	data["loc"] = r.FormValue("location")

	tags, _, err := language.ParseAcceptLanguage(r.Header.Get("Accept-Language"))
	if err == nil && len(tags) > 0 {
		lang := display.English.Languages().Name(tags[0])
		data["lang"] = lang
	}

	data["origin"] = r.Header.Get("Origin")
	country := r.Header.Get("CF-IPCountry")
        if country != "" && country != "XX" {
            data["country"] = strings.ToLower(country)
        }

	data["date"] = now.Format("2006-01-02")
	data["weekday"] = fmt.Sprintf("%d", now.Weekday())
	data["hour"] = fmt.Sprintf("%d", now.Hour())

	userAgent := r.Header.Get("User-Agent")
	ua := uasurfer.Parse(userAgent)

	var browser string
	if ua.Browser.Version.Major != 0 {
		browser = fmt.Sprintf("%s %d", ua.Browser.Name.StringTrimPrefix(), ua.Browser.Version.Major)
	} else {
		browser = fmt.Sprintf("%s", ua.Browser.Name.StringTrimPrefix())
	}
	data["browser"] = browser
	data["device"] = ua.DeviceType.StringTrimPrefix()
	data["platform"] = ua.OS.Platform.StringTrimPrefix()

	logLine := fmt.Sprintf("[%s] %s", now.Format("2006-01-02 15:04:05"), userAgent)
	save(user, data, logLine)
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
		http.Error(w, "Password must have at least 4 charachters", http.StatusBadRequest)
		return
	}

	// also delete anything saved by this user before!!
	res, err := redis.Int64(conn.Do("HSETNX", "users", truncate(user), hash(password)))
	if err != nil {
		log.Println(user, err)
		http.Error(w, err.Error(), 500)
		return
	}
	if res == 0 {
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

func Dashboard(w http.ResponseWriter, r *http.Request) {
	conn := pool.Get()
	defer conn.Close()

	user := r.FormValue("user")
	password := r.FormValue("password")
	if user == "" || password == "" {
		http.Error(w, "Missing Input", http.StatusBadRequest)
		return
	}

	res, _ := redis.String(conn.Do("HGET", "users", user))
	if res == hash(password) {
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

func getData(conn redis.Conn, user string) (map[string]map[string]int64, error) {

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
