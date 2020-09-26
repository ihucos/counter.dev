package main

import (
	"./models"
)

type Data struct {
	Meta  models.MetaData      `json:"meta"`
	Prefs models.MetaData      `json:"prefs"`
	Data  models.TimedStatData `json:"data"`
	Log   models.LogData       `json:"log"`
}

func (ctx Ctx) handleData() {
	user := ctx.ForceUser()
	metaData, err := user.GetMetaData()
	ctx.CatchError(err)
	prefsData, err := user.GetPrefs()
	ctx.CatchError(err)
	logData, err := user.GetLogData()
	ctx.CatchError(err)
	timedData, err := user.GetTimedStatData(ctx.ParseUTCOffset("utcoffset"))
	ctx.CatchError(err)

	data := Data{Meta: metaData, Prefs: prefsData, Data: timedData, Log: logData}
	ctx.ReturnJSON(data, 200)
}
