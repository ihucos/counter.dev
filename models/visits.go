package models

// set needs to overgrow sometimes so it does allow for "trending" new entries
// to catch up with older ones and replace them at some point.
const zetMaxSize = 30
const zetTrimEveryCalls = 100
const truncateAt = 256
const loglinesKeep = 30


var fieldsZet = []string{"lang", "origin", "ref", "loc"}
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
	return fmt.Sprintf("v:%s,%s,%s,%s",
		url.QueryEscape(vik.Origin),
		url.QueryEscape(vik.UserId),
		url.QueryEscape(vik.field),
		url.QueryEscape(vik.TimeRange))

}

type Visits struct {
	redis  redis.Conn
	origin origin
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

func (visits Visits) saveVisitPart(timeRange string, data Visit, expireEntry int) {
	var redisKey string
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: visits.UserId}.String()
		val := data[field]
		if val != "" {
			visits.redis.Send("ZINCRBY", redisKey, 1, truncate(val))
			if rand.Intn(zetTrimEveryCalls) == 0 {
				visits.redis.Send("ZREMRANGEBYRANK", redisKey, 0, -zetMaxSize)
			}
			if expireEntry != -1 {
				visits.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}

	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: visits.id}.String()
		val := data[field]
		if val != "" {
			visits.redis.Send("HINCRBY", redisKey, truncate(val), 1)
			if expireEntry != -1 {
				visits.redis.Send("EXPIRE", redisKey, expireEntry)
			}
		}
	}
}

func (visits Visits) SaveVisit(visit Visit, at time.Time) {
	visits.saveVisitPart(origin, at.Format("2006"), visit, 60*60*24*366)
	visits.saveVisitPart(origin, at.Format("2006-01"), visit, 60*60*24*31)
	visits.saveVisitPart(origin, at.Format("2006-01-02"), visit, 60*60*24)
	visits.saveVisitPart(origin, "all", visit, -1)
}

func (visits Visits) getVisitsPart(timeRange string) (Visits, error) {

	var err error
	var redisKey string
	m := make(Visits)
	for _, field := range fieldsZet {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: visits.id}.String()
		m[field], err = redis.Int64Map(visits.redis.Do("ZRANGE", redisKey, 0, -1, "WITHSCORES"))
		if err != nil {
			log.Println(visits.id, err)
			return nil, err
		}
	}
	for _, field := range fieldsHash {
		redisKey = VisitItemKey{TimeRange: timeRange, field: field, Origin: origin, UserId: visits.id}.String()
		m[field], err = redis.Int64Map(visits.redis.Do("HGETALL", redisKey))
		if err != nil {
			log.Println(visits.UserId, err)
			return nil, err
		}
	}
	return m, nil
}

func (visits Visits) GetVisits(utcOffset int) (TimedVisits, error) {
	nullData := TimedVisits{nil, nil, nil, nil}
	now := utils.TimeNow(utcOffset)
	allStatData, err := visits.getVisitsPart(origin, "all")
	if err != nil {
		return nullData, err
	}
	yearStatData, err := visits.getVisitsPart(origin, now.Format("2006"))
	if err != nil {
		return nullData, err
	}
	monthStatData, err := visits.getVisitsPart(origin, now.Format("2006-01"))
	if err != nil {
		return nullData, err
	}
	dayStatData, err := visits.getVisitsPart(origin, now.Format("2006-01-02"))
	if err != nil {
		return nullData, err
	}
	return TimedVisits{Day: dayStatData, Month: monthStatData, Year: yearStatData, All: allStatData}, nil
}

func (visits Visits) Log(logLine string) {
	redisKey := fmt.Sprintf("log:%s:%s", origin, visits.UserId)
	visits.redis.Send("ZADD", redisKey, time.Now().Unix(), truncate(logLine))
	visits.redis.Send("ZREMRANGEBYRANK", redisKey, 0, -loglinesKeep)
}

func (visits Visits) GetLogs() (LogData, error) {

	logData, err := redis.Int64Map(visits.redis.Do("ZRANGE", fmt.Sprintf("log:%s:%s", origin, user.id), 0, -1, "WITHSCORES"))
	if err != nil {
		log.Println(user.id, err)
		return nil, err
	}

	return logData, nil
}
