package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/avct/uasurfer"
	"github.com/gomodule/redigo/redis"
)

var pool *redis.Pool

var fieldsZet = []string{"lang", "origin", "ref", "loc"}
var fieldsHash = []string{"date", "weekday", "platform", "hour", "browser", "device",}

func main() {

	log.SetFlags(log.LstdFlags | log.Lshortfile)

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

	fmt.Println("Listening...")
	http.ListenAndServe("127.0.0.1:8000", mux)
}

func hash(stri string) string {
	h := sha256.Sum256([]byte(stri))
	return string(h[:])

}

func save(user string, data map[string]string) {
	conn := pool.Get()
	defer conn.Close()
	for _, field := range fieldsZet {
            val := data[field]
            if val != "" {
                conn.Send("ZINCRBY", fmt.Sprintf("%s:%s", field, user), 1, val)
            }
        }
	for _, field := range fieldsHash {
            val := data[field]
            if val != "" {
                conn.Send("HINCRBY", fmt.Sprintf("%s:%s", field, user), val, 1)
            }
        }
}

func Track(w http.ResponseWriter, r *http.Request) {

	data := make(map[string]string)

	user := r.PostFormValue("site")
	if user == "" {
		http.Error(w, "missing uid", http.StatusBadRequest)
		return
	}

	utcoffset, err := strconv.Atoi(r.PostFormValue("utcoffset"))
	if err != nil {
		utcoffset = 0
	}

	location, err := time.LoadLocation("UTC")
	if err != nil {
		panic(err)
	}

	utcnow := time.Now().In(location)
	now := utcnow.Add(time.Hour * time.Duration(utcoffset))

	ref := r.Header.Get("Referrer")
	parsedUrl, err := url.Parse(ref)
	if err == nil && parsedUrl.Host != "" {
		data["ref"] = parsedUrl.Host
	}

	//data["lang"] = r.PostFormValue("language")
	data["loc"] = r.PostFormValue("location")
	data["origin"] = r.Header.Get("Origin")

	data["date"] = now.Format("2006-01-02")
	data["weekday"] = fmt.Sprintf("%d", now.Weekday())
	data["hour"] = fmt.Sprintf("%d", now.Hour())

	userAgent := r.Header.Get("User-Agent")
	ua := uasurfer.Parse(userAgent)
	data["browser"] = fmt.Sprintf("%s %d", ua.Browser.Name.StringTrimPrefix(), ua.Browser.Version.Major)
	data["device"] = ua.DeviceType.StringTrimPrefix()
	data["platform"] = ua.OS.Platform.StringTrimPrefix()

	//last := fmt.Sprintf("%s,%s,%s,%s", now.Format("2006-01-02 15:04:05"), userAgent, r.FormValue("timezone"), loc)
	//data["last"] = last

	save(user, data)
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
	res, err := redis.Int64(conn.Do("HSETNX", "users", user, hash(password)))
	if err != nil {
		log.Println(user, err)
		http.Error(w, err.Error(), 500)
		return
	}
	if res == 0 {
		http.Error(w, "Username taken", http.StatusBadRequest)
	} else {
		userData, err := getData(user, conn)
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

	res, err := redis.String(conn.Do("HGET", "users", user))
	if err != nil {
		log.Println(user, err)
		http.Error(w, err.Error(), 500)
		return
	}
	if res == hash(password) {
		userData, err := getData(user, conn)
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

func getData(user string, conn redis.Conn) (map[string]map[string]int, error) {

	var err error
	m := make(map[string]map[string]int)

	for _, field := range fieldsZet {
		m[field], err = redis.IntMap(conn.Do("ZRANGE", fmt.Sprintf("%s:%s", field, user), 0, -1, "WITHSCORES"))
		if err != nil {
			log.Println(user, err)
			return nil, err
		}
	}
	for _, field := range fieldsHash {
		m[field], err = redis.IntMap(conn.Do("HGETALL", fmt.Sprintf("%s:%s", field, user)))
		if err != nil {
			log.Println(user, err)
			return nil, err
		}
	}
	return m, err
}
