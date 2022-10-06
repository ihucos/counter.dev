package lib

import (
	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/models"
	"gorm.io/gorm/clause"
	"time"
)

// Redis blocks too long if the chunk size is too big but sqlite seems to like
// to write much at once per transaction (Because sqlite does not like
// too many transactions per sec)
const ITERATION_CHUNK_SIZE = 5000

type Record struct {
	Date   string
	User   string
	Origin string
	Field  string
	Value  string
	Count  int64
}

func (app *App) CreateTable() {
	sql := func(stmt string) {
		err := app.DB.Exec(stmt).Error
		if err != nil {
			panic(err)
		}
	}
	sql("CREATE TABLE IF NOT EXISTS `records` (`date` text,`user` text,`origin` text,`field` text,`value` text,`count` integer);")
	sql("CREATE INDEX IF NOT EXISTS `idx_records_date` ON `records`(`date`);")
	sql("CREATE INDEX IF NOT EXISTS `idx_records_value` ON `records`(`value`);")
	sql("CREATE INDEX IF NOT EXISTS `idx_records_field` ON `records`(`field`);")
	sql("CREATE INDEX IF NOT EXISTS `idx_records_origin` ON `records`(`origin`);")
	sql("CREATE INDEX IF NOT EXISTS `idx_records_user` ON `records`(`user`);")
	sql(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique" ON "records" ("date","user","origin","field","value");`)

}

func (app *App) ArchiveHotVisitsForever() {
	nullDuration, _ := time.ParseDuration("0s")
	app.archiveHotVisits(nullDuration)
	for {
		app.archiveHotVisits(app.Config.ArchiveMaxAge)
	}
}

func (app *App) archiveHotVisits(duration time.Duration) {
	cursor := 0

	conn := app.RedisPool.Get()
	dbsize, err := redis.Int64(conn.Do("dbsize"))
	if err != nil {
		panic(err)
	}
	conn.Close()

	// How much time in total each iteration has to take in order to
	// achieve the archive max age but still go easy on the CPU.
	// Higher value means less cpu usage (higher sleep time while working)
	timePerTickGoal := time.Duration(float64(duration) / float64(dbsize/ITERATION_CHUNK_SIZE))

	start := time.Now()
	for {
		startPart := time.Now()

		conn := app.RedisPool.Get()
		cursor = app.archiveHotVisitsPartForce(cursor)
		conn.Close()
		if err != nil {
		}
		time.Sleep(timePerTickGoal - time.Since(startPart))
		if cursor == 0 {
			break
		}
	}
	app.Logger.Printf("Archived all visits in %s. Target was %s", time.Since(start), duration)
}

func (app *App) archiveHotVisitsPartForce(cursor int) int {
	cursor, err := app.archiveHotVisitsPart(cursor)
	if err == nil {
		return cursor
	}
	app.Logger.Printf(
		"archiving visits failed, will retry later: %s\n", err)
	time.Sleep(30 * time.Second)
	app.Logger.Printf( "archiving visits will retry now")
	cursor, err = app.archiveHotVisitsPart(cursor)
	if err == nil {
		app.Logger.Printf( "archiving visits recovered")
		return cursor
	}
	panic(err)
}

func (app *App) archiveHotVisitsPart(cursor int) (int, error) {
	conn := app.RedisPool.Get()
	defer conn.Close()
	arr, err := redis.Values(conn.Do(
		"SCAN", cursor,
		"MATCH", "v:*,*,*,*-*-*",
		"COUNT", ITERATION_CHUNK_SIZE))
	if err != nil {
		return cursor, err
	}

	cursor, err = redis.Int(arr[0], nil)
	if err != nil {
		return cursor, err
	}
	keys, err := redis.Strings(arr[1], nil)
	if err != nil {
		return cursor, err
	}

	// Process this keys batch
	viks := []models.VisitItemKey{}
	for _, key := range keys {
		vik := models.NewVisitItemKey(key)
		redisType := vik.RedisType()
		if redisType == "hash" {
			conn.Send("HGETALL", key)
			viks = append(viks, vik)
		}
		if redisType == "zet" {
			conn.Send("ZRANGE", key, 0, -1, "WITHSCORES")
			viks = append(viks, vik)
		}

	}

	conn.Flush()
	tx := app.DB.Begin()
	for _, vik := range viks {
		v, err := redis.Int64Map(conn.Receive())
		if err != nil {
			return cursor, err
		}
		for key, count := range v {
			record := Record{
				Date:   vik.TimeRange,
				User:   vik.UserId,
				Origin: vik.Origin,
				Field:  vik.Field,
				Value:  key,
				Count:  count,
			}
			err := tx.Clauses(clause.OnConflict{
				UpdateAll: true,
			}).Create(&record).Error
			if err != nil {
				panic(err)
			}
		}
	}
	err = tx.Commit().Error
	if err != nil {
		// Can't write to sqlite db? Something is fundamentally wrong
		panic(err)
	}
	return cursor, nil
}

type QueryArchiveArgs struct {
	User     string
	DateFrom time.Time
	DateTo   time.Time
}

type QueryArchiveResult map[string]map[string]map[string]int64

func (app *App) QueryArchive(queryArgs QueryArchiveArgs) (QueryArchiveResult, error) {
	visits := make(QueryArchiveResult)
	query := app.DB.Model(&Record{}).Select(
		"origin,field,value,sum(count) as count")

	query = query.Where("user = ?", queryArgs.User)

	if !queryArgs.DateFrom.IsZero() {
		query.Where("date >= ?", queryArgs.DateFrom.Format("2006-01-02"))
	}
	if !queryArgs.DateTo.IsZero() {
		query.Where("date <= ?", queryArgs.DateTo.Format("2006-01-02"))
	}

	query = query.Group("origin,field,value")

	rows, err := query.Rows()
	if err != nil {
		return visits, err
	}
	defer rows.Close()

	record := Record{}
	for rows.Next() {
		app.DB.ScanRows(rows, &record)

		// Setting the default values for the map
		_, ok := visits[record.Origin]
		if !ok {
			visits[record.Origin] = make(map[string]map[string]int64)
		}
		_, ok = visits[record.Origin][record.Field]
		if !ok {
			visits[record.Origin][record.Field] = make(map[string]int64)
		}

		visits[record.Origin][record.Field][record.Value] = record.Count

	}
	return visits, nil
}


func (app *App) QueryArchiveOldestDate(userId string) (string, error) {
	var date string
	query := app.DB.Model(&Record{}).Select(
		"min(date)").Where("user = ?", userId)
	query.Scan(&date)
	return date, nil
}
