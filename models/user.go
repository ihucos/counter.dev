package models

import (
	"../utils"
	cryptoRand "crypto/rand"
	"crypto/sha256"
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

type User struct {
	redis redis.Conn
	id    string
}

type ErrCreate struct {
	msg string
}

type StatData map[string]map[string]int64
type LogData map[string]int64
type MetaData map[string]string
type TimedStatData struct {
	Day   StatData `json:"day"`
	Month StatData `json:"month"`
	Year  StatData `json:"year"`
	All   StatData `json:"all"`
}

type Visit map[string]string

type VisitItemKey struct {
	TimeRange string
	UserId    string
	Origin    string
	field     string
}

func (vik VisitItemKey) String() string {
	return fmt.Sprintf("v:%s,%s,%s,%s",
		url.QueryEscape(vik.Origin),
		url.QueryEscape(vik.UserId),
		url.QueryEscape(vik.field),
		url.QueryEscape(vik.TimeRange))

}

func (c *ErrCreate) Error() string {
	return c.msg
}

var fieldsZet = []string{"lang", "origin", "ref", "loc"}
var fieldsHash = []string{"date", "weekday", "platform", "hour", "browser", "device", "country", "screen"}

// taken from here at August 2020:
// https://gs.statcounter.com/screen-resolution-stats
var ScreenResolutions = map[string]bool{
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

func hash(stri string) string {
	h := sha256.Sum256([]byte(stri))
	return string(h[:])
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

func NewUser(conn redis.Conn, userId string) User {
	return User{redis: conn, id: truncate(userId)}
}

func (user User) Close() {
	user.redis.Close()
}

func (user User) saveVisitPart(timeRange string, data Visit, expireEntry int) {
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: user.id}.String()
		val := data[field]
		if val != "" {
			user.redis.Send("ZINCRBY", redisKey, 1, truncate(val))
			if rand.Intn(zetTrimEveryCalls) == 0 {
				user.redis.Send("ZREMRANGEBYRANK", redisKey, 0, -zetMaxSize)
			}
			if expireEntry != -1 {
				user.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}

	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: user.id}.String()
		val := data[field]
		if val != "" {
			user.redis.Send("HINCRBY", redisKey, truncate(val), 1)
			if expireEntry != -1 {
				user.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}
}

func (user User) SaveVisit(origin string, visit Visit, at time.Time) {
	user.saveVisitPart(origin, at.Format("2006"), visit, 60*60*24*366)
	user.saveVisitPart(origin, at.Format("2006-01"), visit, 60*60*24*31)
	user.saveVisitPart(origin, at.Format("2006-01-02"), visit, 60*60*24)
	user.saveVisitPart(origin, "all", visit, -1)
}

func (user User) SaveLogLine(logLine string) {
	user.redis.Send("ZADD", fmt.Sprintf("log:%s", user.id), time.Now().Unix(), truncate(logLine))
	user.redis.Send("ZREMRANGEBYRANK", fmt.Sprintf("log:%s", user.id), 0, -loglinesKeep)

}

func (user User) delUserStats() {
	for _, field := range fieldsZet {
		user.redis.Send("DEL", fmt.Sprintf("%s:%s", field, user.id))
	}
	for _, field := range fieldsHash {
		user.redis.Send("DEL", fmt.Sprintf("%s:%s", field, user.id))
	}
	user.redis.Send("DEL", fmt.Sprintf("log:%s", user.id))
}

func (user User) readToken() (string, error) {
	token, err := redis.String(user.redis.Do("HGET", "tokens", user.id))
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString([]byte(token)), nil
}

func (user User) getStatData(timeRange string) (StatData, error) {

	var err error
	m := make(StatData)

	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: user.id}.String()
		m[field], err = redis.Int64Map(user.redis.Do("ZRANGE", redisKey, 0, -1, "WITHSCORES"))
		if err != nil {
			log.Println(user.id, err)
			return nil, err
		}
	}
	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: user.id}.String()
		m[field], err = redis.Int64Map(user.redis.Do("HGETALL", redisKey))
		if err != nil {
			log.Println(user.id, err)
			return nil, err
		}
	}
	return m, nil
}

func (user User) GetLogData() (LogData, error) {

	logData, err := redis.Int64Map(user.redis.Do("ZRANGE", fmt.Sprintf("log:%s", user.id), 0, -1, "WITHSCORES"))
	if err != nil {
		log.Println(user.id, err)
		return nil, err
	}

	return logData, nil
}

func (user User) GetMetaData() (MetaData, error) {
	meta := make(MetaData)
	token, err := user.readToken()
	if err != nil {
		return meta, err
	}
	meta["token"] = token
	meta["user"] = user.id

	return meta, nil
}

func (user User) GetTimedStatData(origin string, utcOffset int) (TimedStatData, error) {
	nullData := TimedStatData{nil, nil, nil, nil}
	now := utils.TimeNow(utcOffset)
	allStatData, err := user.getStatData("all")
	if err != nil {
		return nullData, err
	}
	yearStatData, err := user.getStatData(origin, now.Format("2006"))
	if err != nil {
		return nullData, err
	}
	monthStatData, err := user.getStatData(origin, now.Format("2006-01"))
	if err != nil {
		return nullData, err
	}
	dayStatData, err := user.getStatData(origin, now.Format("2006-01-02"))
	if err != nil {
		return nullData, err
	}
	return TimedStatData{Day: dayStatData, Month: monthStatData, Year: yearStatData, All: allStatData}, nil
}

func (user User) TouchAccess() {
	user.redis.Send("HSET", "access", user.id, utils.TimeNow(0).Format("2006-01-02"))
}

func (user User) Create(password string) error {

	if len(user.id) < 4 {
		return &ErrCreate{"User must have at least 4 charachters"}
	}

	if len(password) < 8 {
		return &ErrCreate{"Password must have at least 8 charachters"}
	}

	user.redis.Send("MULTI")
	user.redis.Send("HSETNX", "users", user.id, hash(password))
	user.redis.Send("HSETNX", "tokens", user.id, randToken())
	userVarsStatus, err := redis.Ints(user.redis.Do("EXEC"))
	if err != nil {
		return err
	}
	if userVarsStatus[0] == 0 {
		return &ErrCreate{"Username taken"}
	}

	// because user data could have been saved for this user id without an
	// user existing.
	user.delUserStats()

	return nil
}

func (user User) VerifyPassword(password string) (bool, error) {
	hashedPassword, err := redis.String(user.redis.Do("HGET", "users", user.id))
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return hashedPassword != "" && hashedPassword == hash(password), nil
}

func (user User) VerifyToken(token string) (bool, error) {
	dbToken, err := user.readToken()
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return dbToken != "" && dbToken == token, nil
}

func (user User) GetPref(key string) (string, error) {
	val, err := redis.String(user.redis.Do("HGET", fmt.Sprintf("prefs:%s", user.id), key))
	if err == redis.ErrNil {
		return "", nil
	} else if err != nil {
		return "", err
	}
	return val, nil
}

func (user User) GetPrefs() (map[string]string, error) {
	val, err := redis.StringMap(user.redis.Do("HGETALL", fmt.Sprintf("prefs:%s", user.id)))
	if err == redis.ErrNil {
		return map[string]string{}, nil
	} else if err != nil {
		return map[string]string{}, err
	}
	return val, nil
}

func (user User) SetPref(key string, value string) error {
	_, err := user.redis.Do("HSET", fmt.Sprintf("prefs:%s", user.id), key, value)
	if err != nil {
		return err
	}
	return nil
}
