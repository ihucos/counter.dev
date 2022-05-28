package lib

import (
	"fmt"
	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/models"
)

type Record struct {
	User      string
	Site      string
	Dimension string
	Type      string
	Count     int64
}

func (app *App) AutoMigrate() {
	app.DB.AutoMigrate(&Record{})

}

func (app *App) ArchiveHotVisits() error {
	iter := 0
	conn := app.RedisPool.Get()
	defer conn.Close()
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
			vik := models.VisitItemKey{}
			vik.FromString(key)
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
			for key, count := range v {
				record := Record{
					User:      vik.UserId,
					Site:      vik.Origin,
					Dimension: vik.Field,
					Type:      key,
					Count:     count,
				}
			}
		}

		if iter == 0 {
			break
		}
	}

	return nil

}
