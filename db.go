package main

import (
	"encoding/base64"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"log"
	"math/rand"
	"time"
)

// set needs to overgrow sometimes so it does allow for "trending" new entries
// to catch up with older ones and replace them at some point.
const zetMaxSize = 30
const zetTrimEveryCalls = 100
const truncateAt = 256

const loglinesKeep = 30

type DB struct {
	redisPool *redis.Pool
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

func (db DB) SaveVisit(timeRange string, user string, data Visit, expireEntry int) {
	conn := db.redisPool.Get()
	defer conn.Close()
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = fmt.Sprintf("%s:%s:%s", field, timeRange, user)
		val := data[field]
		if val != "" {
			conn.Send("ZINCRBY", redisKey, 1, truncate(val))
			if rand.Intn(zetTrimEveryCalls) == 0 {
				conn.Send("ZREMRANGEBYRANK", fmt.Sprintf("%s:%s:%s", field, timeRange, user), 0, -zetMaxSize)
			}
			if expireEntry != -1 {
				conn.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}

	for _, field := range fieldsHash {
		redisKey = fmt.Sprintf("%s:%s:%s", field, timeRange, user)
		val := data[field]
		if val != "" {
			conn.Send("HINCRBY", redisKey, truncate(val), 1)
			if expireEntry != -1 {
				conn.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}
}

func (db DB) SaveLogLine(user string, logLine string) {
	conn := db.redisPool.Get()
	defer conn.Close()
	conn.Send("ZADD", fmt.Sprintf("log:%s", user), time.Now().Unix(), truncate(logLine))
	conn.Send("ZREMRANGEBYRANK", fmt.Sprintf("log:%s", user), 0, -loglinesKeep)

}

func (db DB) DelUserData(user string) {
	conn := db.redisPool.Get()
	defer conn.Close()
	for _, field := range fieldsZet {
		conn.Send("DEL", fmt.Sprintf("%s:%s", field, user))
	}
	for _, field := range fieldsHash {
		conn.Send("DEL", fmt.Sprintf("%s:%s", field, user))
	}
	conn.Send("DEL", fmt.Sprintf("log:%s", user))
}

func readToken(conn redis.Conn, user string) (string, error) {
	token, err := redis.String(conn.Do("HGET", "tokens", user))
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString([]byte(token)), nil
}

func (db DB) getStatData(timeRange string, user string) (StatData, error) {
	conn := db.redisPool.Get()
	defer conn.Close()

	var err error
	m := make(StatData)

	for _, field := range fieldsZet {
		m[field], err = redis.Int64Map(conn.Do("ZRANGE", fmt.Sprintf("%s:%s:%s", field, timeRange, user), 0, -1, "WITHSCORES"))
		if err != nil {
			log.Println(user, err)
			return nil, err
		}
	}
	for _, field := range fieldsHash {
		m[field], err = redis.Int64Map(conn.Do("HGETALL", fmt.Sprintf("%s:%s:%s", field, timeRange, user)))
		if err != nil {
			log.Println(user, err)
			return nil, err
		}
	}
	return m, nil
}

func getLogData(conn redis.Conn, user string) (LogData, error) {

	logData, err := redis.Int64Map(conn.Do("ZRANGE", fmt.Sprintf("log:%s", user), 0, -1, "WITHSCORES"))
	if err != nil {
		log.Println(user, err)
		return nil, err
	}

	return logData, nil
}

func getMetaData(conn redis.Conn, user string) (MetaData, error) {
	meta := make(MetaData)
	token, err := readToken(conn, user)
	if err != nil {
		return nil, err
	}
	meta["token"] = token
	meta["user"] = user

	return meta, nil
}

func getData(conn redis.Conn, user string, utcOffset int) (Data, error) {
	nullData := Data{nil, TimedStatData{nil, nil, nil, nil}, nil}

	now := timeNow(utcOffset)

	metaData, err := getMetaData(conn, user)
	if err != nil {
		return nullData, err
	}
	logData, err := getLogData(conn, user)
	if err != nil {
		return nullData, err
	}
	allStatData, err := db.getStatData("all", user)
	if err != nil {
		return nullData, err
	}
	yearStatData, err := db.getStatData(now.Format("2006"), user)
	if err != nil {
		return nullData, err
	}
	monthStatData, err := db.getStatData(now.Format("2006-01"), user)
	if err != nil {
		return nullData, err
	}
	dayStatData, err := db.getStatData(now.Format("2006-01-02"), user)
	if err != nil {
		return nullData, err
	}

	return Data{metaData, TimedStatData{Day: dayStatData, Month: monthStatData, Year: yearStatData, All: allStatData}, logData}, nil
}
