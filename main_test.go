package main

import (
	"github.com/gomodule/redigo/redis"
	"github.com/steinfletcher/apitest"
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

func loginCookie(t *testing.T, user string, password string) *apitest.Cookie {
	cookies := apitest.New().
		Handler(InitMux()).
		Post("/login").
		FormData("user", user).
		FormData("password", password).
		Expect(t).
		End().
		Response.
		Cookies()

	if len(cookies) == 0 {
		return apitest.NewCookie("swa").Value("")
	}
	return apitest.NewCookie("swa").Value(cookies[0].Value)
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

func TestApiLoginNoInput(t *testing.T) {
	apitest.New().
		Handler(InitMux()).
		Post("/login").
		Expect(t).
		Status(400).
		Body("Missing Input\n").
		End()
}

func TestApiLoginWrongCredentials(t *testing.T) {
	apitest.New().
		Handler(InitMux()).
		Post("/login").
		FormData("user", "xxx").
		FormData("password", "xxx").
		Expect(t).
		Status(400).
		Body("Wrong username or password\n").
		End()
}

func TestApiLoginSuccess(t *testing.T) {
	apitest.New().
		Handler(InitMux()).
		Post("/login").
		FormData("user", "john").
		FormData("password", "johnjohn").
		Expect(t).
		Status(200).
		Body("OK\n").
		CookiePresent("swa").
		End()
}

func TestAuthSuccess(t *testing.T) {
	apitest.New().
		Handler(InitMux()).
		Post("/data").
		Cookies(loginCookie(t, "john", "johnjohn")).
		Expect(t).
		Status(200).
		End()
}

func TestAuthFailure(t *testing.T) {
	apitest.New().
		Handler(InitMux()).
		Post("/data").
		Cookies(loginCookie(t, "john", "xxx")).
		Expect(t).
		Status(403).
		End()
}
