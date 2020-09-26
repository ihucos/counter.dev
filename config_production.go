package main

func NewConfig() Config {
	return Config{
                RedisUrl: "redis://localhost:6379",
		Bind:         ":80",
		CookieSecret: []byte{123, 58, 112, 163, 184, 117, 1, 79, 253, 212, 157, 174, 169, 165, 141, 27, 37, 84, 70, 57, 47, 86, 26, 20, 12, 248, 43, 83, 229, 112, 218, 24,},
	}
}
