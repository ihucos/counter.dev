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

type DBA struct {
	db DB
        redis redis.Conn
        user string
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


func (dba DB) Open(user string) DBA{
	return DBA{
            db: db,
            redis: db.redisPool.Get(),
            user: user,
        }
}

func (dba DBA) Close() {
   dba.redis.Close() 
}

func (dba DBA) SaveVisit(timeRange string, data Visit, expireEntry int) {
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = fmt.Sprintf("%s:%s:%s", field, timeRange, dba.user)
		val := data[field]
		if val != "" {
			dba.redis.Send("ZINCRBY", redisKey, 1, truncate(val))
			if rand.Intn(zetTrimEveryCalls) == 0 {
				dba.redis.Send("ZREMRANGEBYRANK", fmt.Sprintf("%s:%s:%s", field, timeRange, dba.user), 0, -zetMaxSize)
			}
			if expireEntry != -1 {
				dba.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}

	for _, field := range fieldsHash {
		redisKey = fmt.Sprintf("%s:%s:%s", field, timeRange, dba.user)
		val := data[field]
		if val != "" {
			dba.redis.Send("HINCRBY", redisKey, truncate(val), 1)
			if expireEntry != -1 {
				dba.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}
}

func (dba DBA) SaveLogLine(logLine string) {
	dba.redis.Send("ZADD", fmt.Sprintf("log:%s", dba.user), time.Now().Unix(), truncate(logLine))
	dba.redis.Send("ZREMRANGEBYRANK", fmt.Sprintf("log:%s", dba.user), 0, -loglinesKeep)

}

func (dba DBA) DelUserData() {
	for _, field := range fieldsZet {
		dba.redis.Send("DEL", fmt.Sprintf("%s:%s", field, dba.user))
	}
	for _, field := range fieldsHash {
		dba.redis.Send("DEL", fmt.Sprintf("%s:%s", field, dba.user))
	}
	dba.redis.Send("DEL", fmt.Sprintf("log:%s", dba.user))
}

func (dba DBA) ReadToken() (string, error) {
	token, err := redis.String(dba.redis.Do("HGET", "tokens", dba.user))
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString([]byte(token)), nil
}

func (dba DBA) getStatData(timeRange string) (StatData, error) {

	var err error
	m := make(StatData)

	for _, field := range fieldsZet {
		m[field], err = redis.Int64Map(dba.redis.Do("ZRANGE", fmt.Sprintf("%s:%s:%s", field, timeRange, dba.user), 0, -1, "WITHSCORES"))
		if err != nil {
			log.Println(dba.user, err)
			return nil, err
		}
	}
	for _, field := range fieldsHash {
		m[field], err = redis.Int64Map(dba.redis.Do("HGETALL", fmt.Sprintf("%s:%s:%s", field, timeRange, dba.user)))
		if err != nil {
			log.Println(dba.user, err)
			return nil, err
		}
	}
	return m, nil
}

func (dba DBA) getLogData() (LogData, error) {

	logData, err := redis.Int64Map(dba.redis.Do("ZRANGE", fmt.Sprintf("log:%s", dba.user), 0, -1, "WITHSCORES"))
	if err != nil {
		log.Println(dba.user, err)
		return nil, err
	}

	return logData, nil
}

func (dba DBA) getMetaData() (MetaData, error) {
	meta := make(MetaData)
	token, err := dba.ReadToken()
	if err != nil {
		return nil, err
	}
	meta["token"] = token
	meta["user"] = dba.user

	return meta, nil
}

func (dba DBA) getData(utcOffset int) (Data, error) {
	nullData := Data{nil, TimedStatData{nil, nil, nil, nil}, nil}

	now := timeNow(utcOffset)

	metaData, err := dba.getMetaData()
	if err != nil {
		return nullData, err
	}
	logData, err := dba.getLogData()
	if err != nil {
		return nullData, err
	}
	allStatData, err := dba.getStatData("all")
	if err != nil {
		return nullData, err
	}
	yearStatData, err := dba.getStatData(now.Format("2006"))
	if err != nil {
		return nullData, err
	}
	monthStatData, err := dba.getStatData(now.Format("2006-01"))
	if err != nil {
		return nullData, err
	}
	dayStatData, err := dba.getStatData(now.Format("2006-01-02"))
	if err != nil {
		return nullData, err
	}

	return Data{metaData, TimedStatData{Day: dayStatData, Month: monthStatData, Year: yearStatData, All: allStatData}, logData}, nil
}


func (dba DBA) GetPasswordHash() (string, error) {
	hashedPassword, err := redis.String(dba.redis.Do("HGET", "users", dba.user))
        return hashedPassword, err
}

func (dba DBA) TouchAccess(){
	dba.redis.Send("HSET", "access", dba.user, timeNow(0).Format("2006-01-02"))
}


func (dba DBA) Create(password string) (bool, error) {
	dba.redis.Send("MULTI")
	dba.redis.Send("HSETNX", "users", dba.user, hash(password))
	dba.redis.Send("HSETNX", "tokens", dba.user, randToken())
	userVarsStatus, err := redis.Ints(dba.redis.Do("EXEC"))
        return userVarsStatus[0] == 0, err
}
