package lib

import (
	"fmt"
	"os"
)

type Config struct {
	RedisUrl     string
	Bind         string
	CookieSecret []byte
	PasswordSalt []byte
	SmtpFrom     string
	SmtpPassword string
	SmtpHost     string
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

func NewConfigFromEnv() Config {
	return Config{
		RedisUrl:     envDefault("WEBSTATS_REDIS_URL", "redis://localhost:6379"),
		Bind:         envDefault("WEBSTATS_BIND", ":8000"),
		CookieSecret: []byte(env("WEBSTATS_COOKIE_SECRET")),
		SmtpFrom:     env("WEBSTATS_SMTP_FROM"),
		SmtpPassword: env("WEBSTATS_SMTP_PASSWORD"),
		SmtpHost:     env("WEBSTATS_SMTP_HOST"),
		PasswordSalt: []byte(env("WEBSTATS_PASSWORD_SALT")),
	}

}
