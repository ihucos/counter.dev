package models

import (
	"../utils"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"math/rand"
	"net/url"
	"time"
)

// set needs to overgrow sometimes so it does allow for "trending" new entries
// to catch up with older ones and replace them at some point.
const zetMaxSize = 30
const zetTrimEveryCalls = 100
const truncateAt = 256
const loglinesKeep = 30

var fieldsZet = []string{"lang", "ref", "loc"}
var fieldsHash = []string{"date", "weekday", "platform", "hour", "browser", "device", "country", "screen"}

type VisitsData map[string]map[string]int64
type LogData map[string]int64
type TimedVisits struct {
	Day   VisitsData `json:"day"`
	Month VisitsData `json:"month"`
	Year  VisitsData `json:"year"`
	All   VisitsData `json:"all"`
}

type Visit map[string]string

type VisitItemKey struct {
	TimeRange string
	UserId    string
	Origin    string
	field     string
}

func (vik VisitItemKey) String() string {
	// XXX: TODO: add hash for extra security!!!
	hash := hash(fmt.Sprintf("%s,%s,%s,%s",
		url.QueryEscape(vik.Origin),
		url.QueryEscape(vik.UserId),
		url.QueryEscape(vik.field),
		url.QueryEscape(vik.TimeRange)))
	return fmt.Sprintf("h:%s", hash)

}

type Site struct {
	redis  redis.Conn
	id     string
	userId string
}

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

func (site Site) saveVisitPart(timeRange string, data Visit, expireEntry int) {
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		val := data[field]
		if val != "" {
			site.redis.Send("ZINCRBY", redisKey, 1, truncate(val))
			if rand.Intn(zetTrimEveryCalls) == 0 {
				site.redis.Send("ZREMRANGEBYRANK", redisKey, 0, -zetMaxSize)
			}
			if expireEntry != -1 {
				site.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}

	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		val := data[field]
		if val != "" {
			site.redis.Send("HINCRBY", redisKey, truncate(val), 1)
			if expireEntry != -1 {
				site.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}
}

func (site Site) SaveVisit(visit Visit, at time.Time) {
	site.saveVisitPart(at.Format("2006"), visit, 60*60*24*366)
	site.saveVisitPart(at.Format("2006-01"), visit, 60*60*24*31)
	site.saveVisitPart(at.Format("2006-01-02"), visit, 60*60*24)
	site.saveVisitPart("all", visit, -1)
}

func (site Site) getVisitsPart(timeRange string) (VisitsData, error) {

	var err error
	var redisKey string
	m := make(VisitsData)
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		m[field], err = redis.Int64Map(site.redis.Do("ZRANGE", redisKey, 0, -1, "WITHSCORES"))
		if err != nil {
			return nil, err
		}
	}
	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		m[field], err = redis.Int64Map(site.redis.Do("HGETALL", redisKey))
		if err != nil {
			return nil, err
		}
	}
	return m, nil
}

func (site Site) delVisitPart(timeRange string) {
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		site.redis.Send("DEL", redisKey)
	}
	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		site.redis.Send("DEL", redisKey)
	}
}

func (site Site) DelVisits() {

	// we ignore the fact that at any given time in reality there are three
	// dates going on at the same time and not as this code naively assumes
	// two.
	minDate := utils.TimeNow(-12)
	maxDate := utils.TimeNow(12)

	site.delVisitPart(maxDate.Format("2006"))
	site.delVisitPart(minDate.Format("2006"))
	site.delVisitPart(maxDate.Format("2006-01"))
	site.delVisitPart(minDate.Format("2006-01"))
	site.delVisitPart(maxDate.Format("2006-01-02"))
	site.delVisitPart(minDate.Format("2006-01-02"))
	site.delVisitPart("all")
}

func (site Site) DelLogs() {
	redisKey := fmt.Sprintf("log:%s:%s", site.id, site.userId)
	site.redis.Send("DEL", redisKey)
}

func (site Site) Del() {
	site.DelVisits()
	site.DelLogs()
}

func (site Site) GetVisits(utcOffset int) (TimedVisits, error) {
	nullData := TimedVisits{nil, nil, nil, nil}
	now := utils.TimeNow(utcOffset)
	allStatData, err := site.getVisitsPart("all")
	if err != nil {
		return nullData, err
	}
	yearStatData, err := site.getVisitsPart(now.Format("2006"))
	if err != nil {
		return nullData, err
	}
	monthStatData, err := site.getVisitsPart(now.Format("2006-01"))
	if err != nil {
		return nullData, err
	}
	dayStatData, err := site.getVisitsPart(now.Format("2006-01-02"))
	if err != nil {
		return nullData, err
	}
	return TimedVisits{Day: dayStatData, Month: monthStatData, Year: yearStatData, All: allStatData}, nil
}

func (site Site) Log(logLine string) {
	redisKey := fmt.Sprintf("log:%s:%s", site.id, site.userId)
	site.redis.Send("ZADD", redisKey, time.Now().Unix(), truncate(logLine))
	site.redis.Send("ZREMRANGEBYRANK", redisKey, 0, -loglinesKeep)
}

func (site Site) GetLogs() (LogData, error) {

	logData, err := redis.Int64Map(site.redis.Do("ZRANGE", fmt.Sprintf("log:%s:%s", site.id, site.userId), 0, -1, "WITHSCORES"))
	if err != nil {
		return nil, err
	}

	return logData, nil
}
