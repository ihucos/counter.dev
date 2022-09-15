package main

import (
	"fmt"
	"syscall"

	_ "github.com/ihucos/counter.dev/endpoints"
	"github.com/ihucos/counter.dev/lib"
)

func main() {

	// HOTFIX
	var rLimit syscall.Rlimit
	rLimit.Max = 100307
	rLimit.Cur = 100307
	err := syscall.Setrlimit(syscall.RLIMIT_NOFILE, &rLimit)
	if err != nil {
		fmt.Println("Error Setting Rlimit ", err)
	}

	app := lib.NewApp()
	app.CreateTable()
	go app.ArchiveHotVisitsForever()
	app.ConnectEndpoints()
	app.Logger.Println("Start")
	app.Serve()
}
