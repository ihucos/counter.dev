
package lib

import (
	"github.com/ihucos/counter.dev/models"
)



func (app *App) AutoMigrate() {
	app.DB.AutoMigrate(&models.Record{})

}


func (app *App) ArchiveHotVisits() {

}
