package main

import (
	"github.com/gomodule/redigo/redis"
	"github.com/stretchr/testify/assert"
	"os"
	"testing"
	"time"
)

func TestMain(m *testing.M) {

	pool = &redis.Pool{
		MaxIdle:     10,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			return redis.Dial("tcp", "localhost:6379", redis.DialDatabase(1))
		},
	}
	users = Users{pool}
	conn := pool.Get()
	defer conn.Close()
	conn.Do("flushdb")
	users.New("john").Create("johnjohn")

	code := m.Run()
	os.Exit(code)
}

func TestCreateSuccess(t *testing.T) {
	user := users.New("peter")
	err := user.Create("mypassmypass")
	assert.Equal(t, err, nil)

}

func TestCreateShortPass(t *testing.T) {
	user := users.New("peter")
	err := user.Create("mypadd")
	assert.Contains(t, err.Error(), "at least")

}

func TestCreateUsernameTaken(t *testing.T) {
	user := users.New("peter")
	user.Create("mypassmypass")

	err := user.Create("mypassmypass")
	assert.Contains(t, err.Error(), "Username taken")
}

func TestVerifyPasswordSuccess(t *testing.T) {
	success, _ := users.New("john").VerifyPassword("johnjohn")
	assert.Equal(t, success, true)
}

func TestVerifyPasswordFail(t *testing.T) {
	success, _ := users.New("john").VerifyPassword("xxx")
	assert.Equal(t, success, false)
}
