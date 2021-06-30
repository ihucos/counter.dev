package main

import (
	"github.com/ihucos/counter.dev/lib"
	"syscall"
	"fmt"
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


	app.Logger.Println("Start")
	app.Serve()
}
