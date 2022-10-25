package models

import (
	"fmt"
	"math/rand"
	"net/url"
	"time"
	"strings"
	"gorm.io/gorm"

	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/utils"
)

// set needs to overgrow sometimes so it does allow for "trending" new entries
// to catch up with older ones and replace them at some point.
const zetMaxSize = 100
const zetTrimEveryCalls = 100
const truncateAt = 256
const loglinesKeep = 30

var fieldsZet = []string{"lang", "ref", "loc", "page"}
var fieldsHash = []string{"date", "weekday", "platform", "hour", "browser", "device", "country", "screen"}

type VisitsData map[string]map[string]int64
type LogData map[string]int64
type TimedVisits struct {
	Day       VisitsData `json:"day"`
	Yesterday VisitsData `json:"yesterday"`
	Month     VisitsData `json:"month"`
	Year      VisitsData `json:"year"`
	All       VisitsData `json:"all"`
}

type Visit map[string]string

type VisitItemKey struct {
	TimeRange string
	UserId    string
	Origin    string
	Field     string
}

func (vik VisitItemKey) String() string {
	return fmt.Sprintf("v:%s,%s,%s,%s",
		url.QueryEscape(vik.Origin),
		url.QueryEscape(vik.UserId),
		url.QueryEscape(vik.Field),
		url.QueryEscape(vik.TimeRange))

}

func NewVisitItemKey(key string) VisitItemKey {
	parts := strings.Split(strings.TrimPrefix(key, "v:"), ",")
	vik := VisitItemKey{}
	vik.Origin, _ = url.QueryUnescape(parts[0])
	vik.UserId, _ = url.QueryUnescape(parts[1])
	vik.Field, _ = url.QueryUnescape(parts[2])
	vik.TimeRange, _ = url.QueryUnescape(parts[3])
	return vik

}

func (vik VisitItemKey) RedisType() string {
    for _, i := range fieldsHash {
        if i == vik.Field {
            return "hash"
        }
    }
    for _, i := range fieldsZet {
        if i == vik.Field {
            return "zet"
        }
    }
    return ""
}

type Site struct {
	redis  redis.Conn
	id     string
	userId string
	db *gorm.DB
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

func (site Site) saveVisitPart(timeRange string, data Visit, expireAt time.Time) {
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, Field: field, Origin: site.id, UserId: site.userId}.String()
		val := data[field]
		if val != "" {
			site.redis.Send("ZINCRBY", redisKey, 1, truncate(val))
			if rand.Intn(zetTrimEveryCalls) == 0 {
				site.redis.Send("ZREMRANGEBYRANK", redisKey, 0, -zetMaxSize)
			}
			if !expireAt.IsZero() {
				site.redis.Send("EXPIREAT", redisKey, expireAt.Unix())
			}
		}
	}

	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, Field: field, Origin: site.id, UserId: site.userId}.String()
		val := data[field]
		if val != "" {
			site.redis.Send("HINCRBY", redisKey, truncate(val), 1)
			if !expireAt.IsZero() {
				site.redis.Send("EXPIREAT", redisKey, expireAt.Unix())
			}
		}
	}
}

func (site Site) SaveVisit(visit Visit, at time.Time) {

	// Tolerance for handling time zones and all that nasty stuff
	expireTolerance := time.Hour * 14

	nextYear := time.Date(at.Year(), time.January, 1,
		0, 0, 0, 0,
		at.Location()).AddDate(1, 0, 0)

	nextMonth := time.Date(at.Year(), at.Month(), 1,
		0, 0, 0, 0,
		at.Location()).AddDate(0, 1, 0)

	inTwoDays := time.Date(at.Year(), at.Month(), at.Day(),
		0, 0, 0, 0,
		at.Location()).AddDate(0, 0, 2)

	// This Year
	site.saveVisitPart(
		at.Format("2006"),
		visit,
		nextYear.Add(expireTolerance))

	// This Month
	site.saveVisitPart(
		at.Format("2006-01"),
		visit,
		nextMonth.Add(expireTolerance))

	// Today / Yesterday
	site.saveVisitPart(
		at.Format("2006-01-02"),
		visit,
		// we expire in two days for the yesterday entry
		inTwoDays.Add(expireTolerance))

	// all
	site.saveVisitPart(
		"all",
		visit,
		time.Time{})
}

func (site Site) getVisitsPart(timeRange string) (VisitsData, error) {

	var redisKey string
	var fields []string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, Field: field, Origin: site.id, UserId: site.userId}.String()
		fields = append(fields, field)
		site.redis.Send("ZRANGE", redisKey, 0, -1, "WITHSCORES")
	}
	for _, field := range fieldsHash {
		fields = append(fields, field)
		redisKey = VisitItemKey{TimeRange: timeRange, Field: field, Origin: site.id, UserId: site.userId}.String()
		site.redis.Send("HGETALL", redisKey)
	}
	site.redis.Flush()

	m := make(VisitsData)
	for _, key := range fields {
		v, err := redis.Int64Map(site.redis.Receive())
		if err != nil {
			return m, err
		}
		m[key] = v
	}

	return m, nil
}

func (site Site) delVisitPart(timeRange string) {
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, Field: field, Origin: site.id, UserId: site.userId}.String()
		site.redis.Send("DEL", redisKey)
	}
	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, Field: field, Origin: site.id, UserId: site.userId}.String()
		site.redis.Send("DEL", redisKey)
	}
}

func (site Site) delHotVisits() error {

	// we ignore the fact that at any given time in reality there are three
	// dates going on at the same time and not as this code naively assumes
	// two.
	// TODO: error handling
	minDate := utils.TimeNow(-12)
	maxDate := utils.TimeNow(12)

	site.delVisitPart(maxDate.Format("2006"))
	site.delVisitPart(minDate.Format("2006"))

	site.delVisitPart(maxDate.Format("2006-01"))
	site.delVisitPart(minDate.Format("2006-01"))

	site.delVisitPart(maxDate.AddDate(0, 0, -1).Format("2006-01-02"))
	site.delVisitPart(minDate.AddDate(0, 0, -1).Format("2006-01-02"))

	site.delVisitPart(maxDate.Format("2006-01-02"))
	site.delVisitPart(minDate.Format("2006-01-02"))
	site.delVisitPart("all")
	return nil
}


func (site Site) delArchiveVisits() error {
	err := site.db.Table("records").Where("origin = ?", site.id).Delete(nil).Error
	if err != nil {
		return err
	}
	return nil
}

func (site Site) DelLogs() {
	redisKey := fmt.Sprintf("log:%s:%s", site.id, site.userId)
	site.redis.Send("DEL", redisKey)
}

func (site Site) Del() error {
	err := site.delHotVisits()
	if err != nil {
		return err
	}
	err = site.delArchiveVisits()
	if err != nil {
		return err
	}
	site.DelLogs()
	return nil
}

func (site Site) GetVisits(utcOffset int) (TimedVisits, error) {
	nullData := TimedVisits{nil, nil, nil, nil, nil}
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

	yesterdayStatData, err := site.getVisitsPart(now.AddDate(0, 0, -1).Format("2006-01-02"))
	if err != nil {
		return nullData, err
	}

	return TimedVisits{Day: dayStatData, Yesterday: yesterdayStatData, Month: monthStatData, Year: yearStatData, All: allStatData}, nil
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
