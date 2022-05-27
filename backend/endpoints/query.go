package endpoints

import (
	"github.com/ihucos/counter.dev/lib"
)

type Record struct {
	Site      string
	Dimension string
	Type_     string `gorm:"column:type" json:"type"`
	Count     int
}

func init() {
	lib.Endpoint(lib.EndpointName(), func(ctx *lib.Ctx) {
		dateFrom := ctx.R.FormValue("date_from")
		dateTo := ctx.R.FormValue("date_to")
		user := ctx.ForceUserId()
		query := ctx.App.DB.Model(&Record{}).Select(
			"site,dimension,type,sum(count) as count")

		// important line!!
		query = query.Where("user = ?", user)

		if dateFrom != "" {
			query.Where("date > ?", dateFrom)
		}
		if dateTo != "" {
			query.Where("date > ?", dateFrom)
		}

		query = query.Group("site,dimension,type")

		rows, err := query.Rows()
		defer rows.Close()

		result := []Record{}
		for rows.Next() {
			//record := map[string]interface{}{}
			record := Record{}
			ctx.App.DB.ScanRows(rows, &record)
			result = append(result, record)
		}
		ctx.CatchError(err)
		ctx.ReturnJSON(result, 200)

	})
}
