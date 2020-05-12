package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
    "strconv"

    "github.com/gomodule/redigo/redis"
)

var pool *redis.Pool

func main() {
	pool = &redis.Pool{
		MaxIdle:     10,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", "localhost:6379")
		},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", HelloServer)

	log.Println("Listening...")
	http.ListenAndServe("127.0.0.1:8000", mux)
}

func HelloServer(w http.ResponseWriter, r *http.Request) {
    conn := pool.Get()
    defer conn.Close()

    q := r.URL.Query()
    uid := q.Get("uid")
    if (uid == ""){
        http.Error(w, "missing uid", http.StatusBadRequest)
        return
    }

    ref := q.Get("referrer")
    if (ref != ""){
        conn.Send("ZINCRBY", "ref:" + uid, 1, ref)
    }
    utcoffset, err := strconv.Atoi("12")
    if (err != nil){
      utcoffset = 0
    }

    loc := r.Header.Get("Location")
    if (loc != ""){
        conn.Send("ZINCRBY", "loc:" + uid, 1, loc)
    }


    location, _ := time.LoadLocation("UTC")
    utcnow := time.Now().In(location)
    now := utcnow.Add(time.Hour * time.Duration(utcoffset))
    date := now.Format("2006-01-02")
    conn.Send("HINCRBY", "date:" + uid, date, 1)

    fmt.Fprintf(w, "Ok")
}
