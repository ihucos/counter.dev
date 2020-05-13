package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gomodule/redigo/redis"
)

var pool *redis.Pool

var SVG = "<?xml version=\"1.0\" encoding=\"UTF-8\" ?><svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" width=\"1\" height=\"1\"></svg>"

func main() {

	pool = &redis.Pool{
		MaxIdle:     10,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", "localhost:6379")
		},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/track", Track)
	mux.HandleFunc("/register", Register)
	mux.HandleFunc("/dashboard", Dashboard)

	log.Println("Listening...")
	http.ListenAndServe("127.0.0.1:8000", mux)
}

func hash(stri string) string {
	h := sha256.Sum256([]byte(stri))
	return string(h[:])

}


func httpErr(w http.ResponseWriter, err error){
    http.Error(w, err.Error(), 500)
}


func Track(w http.ResponseWriter, r *http.Request) {
	conn := pool.Get()
	defer conn.Close()

	q := r.URL.Query()
	uid := q.Get("uid")
	if uid == "" {
		http.Error(w, "missing uid", http.StatusBadRequest)
		return
	}

	ref := q.Get("referrer")
	if ref != "" {
		conn.Send("ZINCRBY", "ref:"+uid, 1, ref)
	}
	utcoffset, err := strconv.Atoi("12")
	if err != nil {
		utcoffset = 0
	}

	loc := r.Header.Get("Location")
	if loc != "" {
		conn.Send("ZINCRBY", "loc:"+uid, 1, loc)
	}

	location, err := time.LoadLocation("UTC")
        if (err != nil){httpErr(w, err); return }
	utcnow := time.Now().In(location)
	now := utcnow.Add(time.Hour * time.Duration(utcoffset))
	date := now.Format("2006-01-02")
	conn.Send("HINCRBY", "date:"+uid, date, 1)

        w.Header().Set("Content-Type", "image/svg+xml")
	fmt.Fprintf(w, SVG)
}

func Register(w http.ResponseWriter, r *http.Request) {
	conn := pool.Get()
	defer conn.Close()

	user := r.FormValue("user")
	password := r.FormValue("password")
	if user == "" || password == "" {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	res, err := redis.Int64(conn.Do("HSETNX", "users", user, hash(password)))
        if (err != nil){httpErr(w, err); return }
	if res == 0 {
		fmt.Fprintln(w, "user taken")
	} else {
		fmt.Fprintln(w, "new user created")
	}
}

func Dashboard(w http.ResponseWriter, r *http.Request) {
	conn := pool.Get()
	defer conn.Close()

	user := r.FormValue("user")
	password := r.FormValue("password")
	if user == "" || password == "" {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	res, err := redis.String(conn.Do("HGET", "users", user))
        if (err != nil){httpErr(w, err); return }
	if res == hash(password) {
		userData, err := getData(user, conn)
                if (err != nil){httpErr(w, err); return }
		jsonString, err := json.Marshal(userData)
                if (err != nil){httpErr(w, err); return }
		fmt.Fprintln(w, string(jsonString))
	} else {
		fmt.Fprintln(w, "no login")
	}
}

func getData(user string, conn redis.Conn) (map[string]map[string]int, error) {

	m := make(map[string]map[string]int)

	resp, err := redis.IntMap(conn.Do("HGETALL", "date:4"))
        if (err != nil){return nil, err}
	m["date"] = resp

	resp, err = redis.IntMap(conn.Do("ZRANGE", "loc:4", 0, -1, "WITHSCORES"))
        if (err != nil){return nil, err}
	m["loc"] = resp

	resp, err = redis.IntMap(conn.Do("ZRANGE", "ref:4", 0, -1, "WITHSCORES"))
        if (err != nil){return nil, err}
	m["ref"] = resp

	return m, nil
}
