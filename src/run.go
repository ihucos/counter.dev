package main

import ()

func main() {
	app := NewApp()
	app.Logger.Println("Start")
	app.Serve()
}
