package main

func main() {
	NewApp().Serve(envDefault("BIND", ":80"))
}
