package lib

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	RedisUrl     string
	Bind         string
	CookieSecret []byte
	PasswordSalt []byte
	ArchiveDatabase string
	ArchiveMaxAge time.Duration
	MailgunSecretApiKey string
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


func envDuration(envName string) time.Duration {
	strVal := env(envName)
	duration, err := time.ParseDuration(strVal)
	if err != nil {
		panic(fmt.Sprintf("Not duration given for: %s; %s", envName, err))
	}
	return duration
}

func NewConfigFromEnv() Config {
	return Config{
		RedisUrl:     envDefault("WEBSTATS_REDIS_URL", "redis://localhost:6379"),
		Bind:         envDefault("WEBSTATS_BIND", ":8000"),
		CookieSecret: []byte(env("WEBSTATS_COOKIE_SECRET")),
		PasswordSalt: []byte(env("WEBSTATS_PASSWORD_SALT")),
		ArchiveDatabase: env("WEBSTATS_ARCHIVE_DATABASE"),
		ArchiveMaxAge: envDuration("WEBSTATS_ARCHIVE_MAX_AGE"),
		MailgunSecretApiKey:     envDefault("WEBSTATS_MAILGUN_SECRET_API_KEY", "dummy"),
	}

}
