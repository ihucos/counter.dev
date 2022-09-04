package models

import (
	cryptoRand "crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/utils"
	uuidLib "github.com/google/uuid"
)

var uuid2id = map[string]string{}

type User struct {
	redis redis.Conn
	Id    string
	passwordSalt string
}

type ErrUser struct {
	msg string
}

func (c *ErrUser) Error() string {
	return c.msg
}

type MetaData map[string]string

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

func NewUser(conn redis.Conn, userId string, passwordSalt []byte) User {
	return User{redis: conn, Id: truncate(userId), passwordSalt: string(passwordSalt)}
}

func NewUserByCachedUUID(conn redis.Conn, uuid string, passwordSalt []byte) (User, error){
	var err error
	// Basically we must 'id' here so it can be set inside the if clause
	var id string
	var ok bool
	id, ok = uuid2id[uuid]
	if ! ok {
		// hit the redis db
		id, err = redis.String(conn.Do("HGET", "uuid2id", uuid))
		if err == redis.ErrNil {
			return User{}, fmt.Errorf("No such user with uuid: %s", uuid)
		} else if err != nil {
			return User{}, err
		}

		// cache the value in memory
		uuid2id[uuid] = id
	}
	return NewUser(conn, id, passwordSalt), nil
}

func (user User) hashPassword(password string) string {
	return hash(hash(password) + user.passwordSalt)
}

func (user User) DelAllSites() error {
	linkedSites, err := user.GetSiteLinks()
	if err != nil {
		return err
	}
	for siteId, _ := range linkedSites {
		user.NewSite(siteId).Del()
	}
	user.delAllSiteLinks()
	return nil
}

func (user User) Disable() error {
	err := user.redis.Send("HSET", "tokens", user.Id, "")
	if err != nil {
		return err
	}
	err = user.redis.Send("HSET", "users", user.Id, "")
	if err != nil {
		return err
	}
	return nil
}

func (user User) ReadToken() (string, error) {
	token, err := redis.String(user.redis.Do("HGET", "tokens", user.Id))
	if err != nil {
		return "", err
	}
	return  base64.URLEncoding.EncodeToString([]byte(token)), nil
}


func (user User) ReadUUID() (string, error) {
	return redis.String(user.redis.Do("HGET", "id2uuid", user.Id))
}

func (user User) DeleteToken() error {
	_, err := user.redis.Do("HSET", "tokens", user.Id, "")
	return err
}

func (user User) ResetToken() error {
	_, err := user.redis.Do("HSET", "tokens", user.Id, randToken()[:12])
	return err
}

func (user User) GetMetaData() (MetaData, error) {
	meta := make(MetaData)
	token, err := user.ReadToken()
	if err != nil {
		return meta, err
	}
	uuid, err := user.ReadUUID()
	if err != nil {
		return meta, err
	}
	meta["token"] = token
	meta["uuid"] = uuid
	meta["user"] = user.Id

	return meta, nil
}

func (user User) TouchAccess() {
	user.redis.Send("HSET", "access", user.Id, utils.TimeNow(0).Format("2006-01-02"))
}

func (user User) Create(password string) error {

	if len(user.Id) < 4 {
		return &ErrUser{"User must have at least 4 characters"}
	}

	if len(password) < 8 {
		return &ErrUser{"Password must have at least 8 characters"}
	}

	uuid := uuidLib.New().String()
	user.redis.Send("MULTI")
	user.redis.Send("HSETNX", "users", user.Id, user.hashPassword(password))
	user.redis.Send("HSETNX", "tokens", user.Id, "")
	user.redis.Send("HSETNX", "id2uuid", user.Id, uuid)
	user.redis.Send("HSETNX", "uuid2id", uuid, user.Id)
	userVarsStatus, err := redis.Ints(user.redis.Do("EXEC"))
	if err != nil {
		return err
	}
	if userVarsStatus[0] == 0 {
		return &ErrUser{"Username taken"}
	}

	// because user data could have been saved for this user id without an
	// user existing.
	user.DelAllSites()

	return nil
}

func (user User) ChangePassword(password string) error {
	_, err := user.redis.Do("HSET", "users", user.Id, user.hashPassword(password))
	if err != nil {
		return err
	}
	return nil
}

func (user User) VerifyPassword(password string) (bool, error) {
	hashedPassword, err := redis.String(user.redis.Do("HGET", "users", user.Id))
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return hashedPassword != "" && hashedPassword == user.hashPassword(password), nil
}

func (user User) VerifyRecoveryToken(token string) (bool, error) {
	hashedRecoveryToken, err := redis.String(user.redis.Do("GET",
		fmt.Sprintf("recover-token:%s", user.Id)))
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return hashedRecoveryToken != "" && hashedRecoveryToken == hash(token), nil
}

func (user User) NewRecoveryToken() (string, error) {
	expire := 60 * 15  // 15 minutes
	token := randToken()[:12]
	_, err := user.redis.Do("SETEX",
		fmt.Sprintf("recover-token:%s", user.Id), expire, hash(token))
	return token, err
}

func (user User) VerifyToken(token string) (bool, error) {
	dbToken, err := user.ReadToken()
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return dbToken != "" && dbToken == token, nil
}

func (user User) GetPref(key string) (string, error) {
	val, err := redis.String(user.redis.Do("HGET", fmt.Sprintf("prefs:%s", user.Id), key))
	if err == redis.ErrNil {
		return "", nil
	} else if err != nil {
		return "", err
	}
	return val, nil
}

func (user User) GetPrefs() (map[string]string, error) {
	val, err := redis.StringMap(user.redis.Do("HGETALL", fmt.Sprintf("prefs:%s", user.Id)))
	if err == redis.ErrNil {
		return map[string]string{}, nil
	} else if err != nil {
		return map[string]string{}, err
	}
	return val, nil
}

func (user User) GetSiteLinks() (map[string]int, error) {
	val, err := redis.IntMap(user.redis.Do("HGETALL", fmt.Sprintf("sites:%s", user.Id)))
	empty := map[string]int{}
	if err == redis.ErrNil {
		return empty, nil
	} else if err != nil {
		return empty, err
	}
	return val, nil
}

func (user User) GetPreferredSiteLinks() (map[string]int, error) {
	useSitesPref, err := user.GetPref("usesites")
	if err != nil {
		return map[string]int{}, err
	}
	dbSiteLinks, err := user.GetSiteLinks()
	if err != nil {
		return map[string]int{}, err
	}

	if useSitesPref == "" {
		return dbSiteLinks, nil
	} else {

		sitesPref, err := user.GetPref("sites")
		if err != nil {
			return map[string]int{}, err
		}

		siteLinks := make(map[string]int)
		for _, site := range strings.Fields(sitesPref) {
			siteLinks[site] = dbSiteLinks[site]
		}
		return siteLinks, nil
	}
}

func (user User) HasSiteLinks() (bool, error) {
	return redis.Bool(user.redis.Do("EXISTS", fmt.Sprintf("sites:%s", user.Id)))
}

func (user User) SetPref(key string, value string) error {
	_, err := user.redis.Do("HSET", fmt.Sprintf("prefs:%s", user.Id), key, value)
	if err != nil {
		return err
	}
	return nil
}

func (user User) NewSite(Id string) Site {
	return Site{redis: user.redis, userId: user.Id, id: Id}
}

func (user User) IncrSiteLink(siteId string) {
	user.redis.Send("HINCRBY", fmt.Sprintf("sites:%s", user.Id), siteId, 1)
}

func (user User) DelSiteLink(siteId string) (bool, error) {
	deleted, err := redis.Int64(user.redis.Do("HDEL", fmt.Sprintf("sites:%s", user.Id), siteId))
	return deleted == 1, err
}

func (user User) delAllSiteLinks() {
	user.redis.Send("DEL", fmt.Sprintf("sites:%s", user.Id))
}

func (user User) Signal() {
	user.redis.Send("PUBLISH", fmt.Sprintf("user:%s", user.Id), "")
}

func (user User) HandleSignals(conn redis.Conn, cb func(error)) {
	psc := redis.PubSubConn{conn}
	psc.Subscribe(fmt.Sprintf("user:%s", user.Id))
	defer psc.Unsubscribe()
	defer psc.Close()
	for {
		switch v := psc.Receive().(type) {
		case redis.Message:
			cb(nil)
		case error:
			cb(v)
		}
	}
}


func (user User) PasswordRecovery() error {
	token, err := user.NewRecoveryToken()
	if err != nil {
		return err
	}
	mail, err := user.GetPref("mail")
	if err != nil {
		return err
	}
	// send email with token here
	return nil
}
