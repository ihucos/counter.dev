package models

import (
	"../utils"
	"fmt"
	"github.com/gomodule/redigo/redis"
	"math/rand"
	"net/url"
	"time"
	"bytes"
	"encoding/gob"
	"github.com/syndtr/goleveldb/leveldb"
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

func (vd VisitsData) Merge(other *VisitsData) {
	for otherField := range *other {
		_, found := vd[otherField]
		if ! found {
			vd[otherField] = make(map[string]int64)	
		}
		for otherKey := range (*other)[otherField] {
			otherVal := (*other)[otherField][otherKey]
			current, found := vd[otherField][otherKey]
			if ! found {
				current = 0
			}
			vd[otherField][otherKey] = current + otherVal
		}
	}
}

type LogData map[string]int64
type TimedVisits struct {
	Day       VisitsData `json:"day"`
	Yesterday VisitsData `json:"yesterday"`
	Week VisitsData `json:"week"`
	Month     VisitsData `json:"month"`
	Year      VisitsData `json:"year"`
	All       VisitsData `json:"all"`
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

type Site struct {
	redis  redis.Conn
	Leveldb *leveldb.DB
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

func formatWeekKey(time time.Time) string{
	year, week := time.ISOWeek()
	return fmt.Sprintf("%d-cw%d", year, week)
}

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
	site.saveVisitPart(formatWeekKey(at), visit, 60*60*24*7)

	// we expire after two days for the yesterday entry
	site.saveVisitPart(at.Format("2006-01-02"), visit, 60*60*24*2)

	site.saveVisitPart("all", visit, -1)
}

func (site Site) getHotVisitsPart(timeRange string) (VisitsData, error) {

	var redisKey string
	var fields []string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		fields = append(fields, field)
		site.redis.Send("ZRANGE", redisKey, 0, -1, "WITHSCORES")
	}
	for _, field := range fieldsHash {
		fields = append(fields, field)
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
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


func (site Site) getVisitsPart(timeRange string) (VisitsData, error) {

	var fields []string
	for _, field := range fieldsZet {
		fields = append(fields, field)
	}
	for _, field := range fieldsHash {
		fields = append(fields, field)
	}

	m := make(VisitsData)
	for _, field := range fields {
		dbkey := VisitItemKey{TimeRange: timeRange, field: field, Origin: site.id, UserId: site.userId}.String()
		//fmt.Println("level db get:", dbkey)
		encodedVal, err := site.Leveldb.Get([]byte(dbkey), nil)
		switch err {
			case leveldb.ErrNotFound:
				m[field] = make(map[string]int64)
			case nil:
				buffer := bytes.NewBuffer(encodedVal)
				decoder := gob.NewDecoder(buffer)
				val := make(map[string]int64)
				err := decoder.Decode(&val)
				if err != nil {
					return m, err
				}
				m[field] = val
			case nil:
			default:
				return nil, err
		}
	}
	return m, nil

}

func (site Site) getVisitsDayRange(from time.Time, to time.Time) (VisitsData, error) {
	// if you do a range with 30 days he does like 2000 key accesses on
	// leveldb. This needs to be optimized by using intermediate weeks (and
	// maybe even months an year) entries when possible.
	v := make(VisitsData)
	for current := from; to.After(current); current = current.AddDate(0, 0, 1) {
		vPart, err := site.getVisitsPart(current.Format("2006-01-02"))
		if err != nil {
			return nil, err
		}
		v.Merge(&vPart)

	}
	return v, nil
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

func (site Site) delHotVisits() {

	// we ignore the fact that at any given time in reality there are three
	// dates going on at the same time and not as this code naively assumes
	// two.
	minDate := utils.TimeNow(-12)
	maxDate := utils.TimeNow(12)

	site.delVisitPart(maxDate.Format("2006"))
	site.delVisitPart(minDate.Format("2006"))

	site.delVisitPart(maxDate.Format("2006-01"))
	site.delVisitPart(minDate.Format("2006-01"))

	site.delVisitPart(formatWeekKey(maxDate))
	site.delVisitPart(formatWeekKey(minDate))

	site.delVisitPart(maxDate.AddDate(0, 0, -1).Format("2006-01-02"))
	site.delVisitPart(minDate.AddDate(0, 0, -1).Format("2006-01-02"))

	site.delVisitPart(maxDate.Format("2006-01-02"))
	site.delVisitPart(minDate.Format("2006-01-02"))
	site.delVisitPart("all")
}

func (site Site) delLogs() {
	redisKey := fmt.Sprintf("log:%s:%s", site.id, site.userId)
	site.redis.Send("DEL", redisKey)
}

func (site Site) Del() {
	site.delHotVisits()
	// site.DelVisits() // XXXXXX IMPLEMENTE!
	site.delLogs()
}

func (site Site) GetVisits(utcOffset int) (TimedVisits, error) {
	nullData := TimedVisits{nil, nil, nil, nil, nil, nil}
	now := utils.TimeNow(utcOffset)
	allStatData, err := site.getVisitsDayRange(now.AddDate(0, 0, -30), now)
	if err != nil {
		return nullData, err
	}
	yearStatData, err := site.getHotVisitsPart(now.Format("2006"))
	if err != nil {
		return nullData, err
	}
	monthStatData, err := site.getHotVisitsPart(now.Format("2006-01"))
	if err != nil {
		return nullData, err
	}
	weekStatData, err := site.getHotVisitsPart(formatWeekKey(now))
	if err != nil {
		return nullData, err
	}
	dayStatData, err := site.getHotVisitsPart(now.Format("2006-01-02"))
	if err != nil {
		return nullData, err
	}

	yesterdayStatData, err := site.getVisitsPart(now.AddDate(0, 0, -1).Format("2006-01-02"))
	if err != nil {
		return nullData, err
	}

	return TimedVisits{Day: dayStatData, Yesterday: yesterdayStatData, Week: weekStatData, Month: monthStatData, Year: yearStatData, All: allStatData}, nil
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
