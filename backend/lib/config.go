package lib

import (
	"fmt"
	"os"
	"encoding/base64"
)

type Config struct {
	RedisUrl     string
	Bind         string
	CookieSecret []byte
	PasswordSalt []byte
	CryptSecret  []byte
}

func env(env string) string {
	v := os.Getenv(env)
	if v == "" {
		panic(fmt.Sprintf("empty or missing env: %s", env))
	}
	return v
}
func envDefault(env string, fallback string) string {
	v := os.Getenv(env)
	if v == "" {
		return fallback
	}
	return v
}

func b64decode(stri string) []byte {
	decoded, err :=base64.StdEncoding.DecodeString(stri)
	if err != nil {
		panic(err)
	}
	return decoded
}

func NewConfigFromEnv() Config {
	return Config{
		RedisUrl:     envDefault("WEBSTATS_REDIS_URL", "redis://localhost:6379"),
		Bind:         envDefault("WEBSTATS_BIND", ":8000"),
		CookieSecret: []byte(env("WEBSTATS_COOKIE_SECRET")),
		PasswordSalt: []byte(env("WEBSTATS_PASSWORD_SALT")),
		CryptSecret: b64decode(env("WEBSTATS_CRYPT_SECRET")),
	}

}
