package lib

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/models"
	"time"
	"gorm.io/gorm/clause"
)

type Record struct {
	User      string `gorm:"index:idx_unique"`
	Site      string `gorm:"index:idx_unique"`
	Dimension string `gorm:"index:idx_unique"`
	Type      string `gorm:"index:idx_unique"`
	Count     int64  `gorm:"index:idx_unique"`
}

func (app *App) AutoMigrate() {
	app.DB.AutoMigrate(&Record{})

}

func (app *App) ArchiveHotVisits() {
	iter := 0
	conn := app.RedisPool.Get()
	defer conn.Close()
	tx := app.DB.Begin()
	start := time.Now()
	for {
		arr, err := redis.Values(conn.Do("SCAN", iter, "MATCH", "v:*,*,*,*-*-*", "COUNT", "1000"))
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
				// Not working!
				// USE WAL. Currently reads are locked by writes
			}
		}

		if iter == 0 {
			break
		}
	}
	tx.Commit()

	fmt.Printf(" execution time %s\n", time.Since(start))
}
