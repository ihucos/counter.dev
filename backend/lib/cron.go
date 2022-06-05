package lib

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/models"
	"time"
	"gorm.io/gorm/clause"
)


const ITERATION_TIME = time.Duration(30 * time.Second)
const CHUNK_SIZE = 30

type Record struct {
	User      string `gorm:"uniqueIndex:idx_unique"`
	Site      string `gorm:"uniqueIndex:idx_unique"`
	Dimension string `gorm:"uniqueIndex:idx_unique"`
	Type      string `gorm:"uniqueIndex:idx_unique"`
	Count     int64 
}

func (app *App) AutoMigrate() {
	app.DB.AutoMigrate(&Record{})

}

func (app *App) ArchiveHotVisits() {
	iter := 0
	conn := app.RedisPool.Get()
	defer conn.Close()


	dbsize, err := redis.Int64(conn.Do("dbsize"))
	if err != nil {
		panic(err)
	}
	timePerIteration := time.Duration(float64(ITERATION_TIME) / float64(dbsize / CHUNK_SIZE))

	start := time.Now()
	for {
		startItration := time.Now()
		arr, err := redis.Values(conn.Do("SCAN", iter, "MATCH", "v:*,*,*,*-*-*", "COUNT", CHUNK_SIZE))
		if err != nil {
			panic(err)
		}

		iter, err = redis.Int(arr[0], nil)
		if err != nil {
			panic(err)
		}
		keys, err := redis.Strings(arr[1], nil)
		if err != nil {
			panic(err)
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
				panic(err)
			}
			for key, count := range v {
				record := Record{
					User:      vik.UserId,
					Site:      vik.Origin,
					Dimension: vik.Field,
					Type:      key,
					Count:     count,
				}
				tx.Clauses(clause.OnConflict{
					UpdateAll: true,
				}).Create(&record)
			}
		}
		tx.Commit()

		time.Sleep(timePerIteration - time.Since(startItration))


		if iter == 0 {
			break
		}
	}

	fmt.Printf(" execution time %s\n", time.Since(start))
}
