package lib

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/models"
)

type Record struct {
	User      string  `gorm:"index:idx_unique,unique"`
	Site      string  `gorm:"index:idx_unique,unique"`
	Dimension string  `gorm:"index:idx_unique,unique"`
	Type      string  `gorm:"index:idx_unique,unique"`
	Count     int64  `gorm:"index:idx_unique,unique"`
}

func (app *App) AutoMigrate() {
	app.DB.AutoMigrate(&Record{})

}

func (app *App) ArchiveHotVisits() error {
	iter := 0
	conn := app.RedisPool.Get()
	defer conn.Close()
	tx := app.DB.Begin()
	for {
		arr, err := redis.Values(conn.Do("SCAN", iter, "MATCH", "v:*,*,*,*-*-*", "COUNT", "100"))
		if err != nil {
			return err
		}

		iter, err = redis.Int(arr[0], nil)
		if err != nil {
			return err
		}
		keys, err := redis.Strings(arr[1], nil)
		if err != nil {
			return err
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

		for _, vik := range viks {
			v, err := redis.Int64Map(conn.Receive())
			if err != nil {
				return err
			}
			fmt.Println("hi")
			for key, count := range v {
				record := Record{
					User:      vik.UserId,
					Site:      vik.Origin,
					Dimension: vik.Field,
					Type:      key,
					Count:     count,
				}
				fmt.Println(record)
				tx.Create(&record)
			}
		}

		if iter == 0 {
			break
		}
	}
	tx.Commit()

	return nil

}
