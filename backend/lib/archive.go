package lib

import (
	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/models"
	"gorm.io/gorm/clause"
	"time"
)

// Higher value means less cpu usage (higher sleep time while working)
const MAX_ARCHIVE_AGE = time.Duration(3 * time.Second)

const ITERATION_CHUNK_SIZE = 100

type Record struct {
	Date   string `gorm:"index"`
	User   string `gorm:"index"`
	Origin string `gorm:"index"`
	Field  string `gorm:"index"`
	Value  string `gorm:"index"`
	Count  int64
}

func (app *App) AutoMigrate() {
	err := app.DB.AutoMigrate(&Record{})
	if err != nil {
		panic(err)
	}

	// Raw SQL needed because https://github.com/go-gorm/gorm/issues/5401
	err = app.DB.Exec(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique" ON
		"records" ("date","user","origin","field","value")`).Error
	if err != nil {
		panic(err)
	}
}

func (app *App) ArchiveHotVisitsForever() {
	for {
		app.archiveHotVisits()
	}
}

func (app *App) archiveHotVisits() {
	cursor := 0

	conn := app.RedisPool.Get()
	dbsize, err := redis.Int64(conn.Do("dbsize"))
	if err != nil {
		panic(err)
	}
	conn.Close()

	// How much time in total each iteration has to take in order to
	// achieve the MAX_ARCHIVE_AGE but still go easy on the CPU
	timePerTickGoal := time.Duration(float64(MAX_ARCHIVE_AGE) / float64(dbsize/ITERATION_CHUNK_SIZE))

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
	app.Logger.Printf("Archived all data in %s", time.Since(start).String())
}

func (app *App) archiveHotVisitsPartForce(cursor int) int {
	cursor, err := app.archiveHotVisitsPart(cursor)
	if err == nil {
		return cursor
	}
	app.Logger.Printf(
		"archiveHotVisitsPart with cursor %d failed first time: %s\n",
		cursor,
		err)

	cursor, err = app.archiveHotVisitsPart(cursor)
	if err == nil {
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
	DateFrom string
	DateTo   string
}

type QueryArchiveResult map[string]map[string]map[string]int64

func (app *App) QueryArchive(queryArgs QueryArchiveArgs) (QueryArchiveResult, error) {
	visits := make(QueryArchiveResult)
	query := app.DB.Model(&Record{}).Select(
		"origin,field,value,sum(count) as count")

	query = query.Where("user = ?", queryArgs.User)

	if queryArgs.DateFrom != "" {
		query.Where("date > ?", queryArgs.DateFrom)
	}
	if queryArgs.DateTo != "" {
		query.Where("date > ?", queryArgs.DateTo)
	}

	query = query.Group("site,dimension,type")

	rows, err := query.Rows()
	if err != nil {
		return visits, err
	}
	defer rows.Close()

	record := Record{}
	for rows.Next() {
		app.DB.ScanRows(rows, &record)

		// init boilerplate
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
