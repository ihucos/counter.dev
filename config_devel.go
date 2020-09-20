package main

func NewConfig() Config {
	return Config{
		Bind:         ":8080",
		CookieSecret: []byte("dahhh"),
	}
}
