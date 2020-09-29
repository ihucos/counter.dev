package models

import (
	"../utils"
	cryptoRand "crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"github.com/gomodule/redigo/redis"
)

type User struct {
	redis redis.Conn
	id    string
}

type ErrCreate struct {
	msg string
}

type MetaData map[string]string

func (c *ErrCreate) Error() string {
	return c.msg
}

func hash(stri string) string {
	h := sha256.Sum256([]byte(stri))
	return string(h[:])
}

func randToken() string {
	raw := make([]byte, 512)
	cryptoRand.Read(raw)
	return hash(string(raw))
}

func truncate(stri string) string {
	if len(stri) > truncateAt {
		return stri[:truncateAt]
	}
	return stri
}

func NewUser(conn redis.Conn, userId string) User {
	return User{redis: conn, id: truncate(userId)}
}

func (user User) Close() {
	user.redis.Close()
}

func (user User) delAllVisits() {
	/// FIXME THIS FUNCTION THING IS WRONG! ////XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
	for _, field := range fieldsZet {
		user.redis.Send("DEL", fmt.Sprintf("%s:%s", field, user.id))
	}
	for _, field := range fieldsHash {
		user.redis.Send("DEL", fmt.Sprintf("%s:%s", field, user.id))
	}
	user.redis.Send("DEL", fmt.Sprintf("log:%s", user.id))
}

func (user User) readToken() (string, error) {
	token, err := redis.String(user.redis.Do("HGET", "tokens", user.id))
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString([]byte(token)), nil
}

func (user User) GetMetaData() (MetaData, error) {
	meta := make(MetaData)
	token, err := user.readToken()
	if err != nil {
		return meta, err
	}
	meta["token"] = token
	meta["user"] = user.id

	return meta, nil
}

func (user User) TouchAccess() {
	user.redis.Send("HSET", "access", user.id, utils.TimeNow(0).Format("2006-01-02"))
}

func (user User) Create(password string) error {

	if len(user.id) < 4 {
		return &ErrCreate{"User must have at least 4 charachters"}
	}

	if len(password) < 8 {
		return &ErrCreate{"Password must have at least 8 charachters"}
	}

	user.redis.Send("MULTI")
	user.redis.Send("HSETNX", "users", user.id, hash(password))
	user.redis.Send("HSETNX", "tokens", user.id, randToken())
	userVarsStatus, err := redis.Ints(user.redis.Do("EXEC"))
	if err != nil {
		return err
	}
	if userVarsStatus[0] == 0 {
		return &ErrCreate{"Username taken"}
	}

	// because user data could have been saved for this user id without an
	// user existing.
	user.delAllVisits()

	return nil
}

func (user User) VerifyPassword(password string) (bool, error) {
	hashedPassword, err := redis.String(user.redis.Do("HGET", "users", user.id))
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return hashedPassword != "" && hashedPassword == hash(password), nil
}

func (user User) VerifyToken(token string) (bool, error) {
	dbToken, err := user.readToken()
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return dbToken != "" && dbToken == token, nil
}

func (user User) GetPref(key string) (string, error) {
	val, err := redis.String(user.redis.Do("HGET", fmt.Sprintf("prefs:%s", user.id), key))
	if err == redis.ErrNil {
		return "", nil
	} else if err != nil {
		return "", err
	}
	return val, nil
}

func (user User) GetPrefs() (map[string]string, error) {
	val, err := redis.StringMap(user.redis.Do("HGETALL", fmt.Sprintf("prefs:%s", user.id)))
	if err == redis.ErrNil {
		return map[string]string{}, nil
	} else if err != nil {
		return map[string]string{}, err
	}
	return val, nil
}

func (user User) SetPref(key string, value string) error {
	_, err := user.redis.Do("HSET", fmt.Sprintf("prefs:%s", user.id), key, value)
	if err != nil {
		return err
	}
	return nil
}

func (user User) NewSite(id string) Site {
	return Site{redis: user.redis, userId: user.id, id: id}
}

func (user User) incrSiteLink(siteid string) error {
	_, err := user.redis.Do("ZINCRBY", fmt.Sprintf("sites:%s", user.id), key, value)
	if err != nil {
		return err
	}
	return nil
}
