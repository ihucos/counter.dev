package main

func NewConfig() Config {
	return Config{
		RedisUrl:     "redis://localhost:6379",
		Bind:         ":8080",
		CookieSecret: []byte("mytestnonsecret"),
	}
}
