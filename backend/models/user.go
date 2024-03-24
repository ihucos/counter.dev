package models

import (
	cryptoRand "crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"strings"
	"time"
	"context"

	"github.com/gomodule/redigo/redis"
	"github.com/ihucos/counter.dev/utils"
	"gorm.io/gorm"
	uuidLib "github.com/google/uuid"
	"github.com/mailgun/mailgun-go/v4"
)


var surveySender string = "hey@counter.dev"
var surveySubject string = "Is counter.dev useful?"
var surveyText string = `Hello %s,

you registered to https://counter.dev/ some days ago. In order to improve the service we would like to ask you three very short questions: https://forms.gle/EFZaq5zKv6YGdPro9

Feel free to write anything that might be in your mind as a reply to this email as well.


Thank you. Your feedback is appreciated!

Your counter.dev team`




var passwordRecoverySender string = "hey@counter.dev"
var passwordRecoverSubject string = "Forgot your password?"
var passwordRecoveryContent string = `Hello %s,

You - or possibly someone else - requested to recover your account. Therefore we created an alternative temporary password.

user: %s
password: %s (Will expire in 15 minutes)

Login at http://counter.dev/ and if desired change your password in the account settings. As a precaution measure please ensure the given domain is correct and that this email looks plausible.

Reply if you have any questions.


Cheers,

The counter.dev team`


var uuid2id = map[string]string{}

type User struct {
	redis redis.Conn
	db    *gorm.DB
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

func NewUser(conn redis.Conn, userId string, db *gorm.DB, passwordSalt []byte) User {
	return User{redis: conn, Id: truncate(userId), passwordSalt: string(passwordSalt), db: db}
}

func NewUserByCachedUUID(conn redis.Conn, uuid string, db *gorm.DB, passwordSalt []byte) (User, error){
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
	return NewUser(conn, id, db, passwordSalt), nil
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
		err := user.NewSite(siteId).Del()
		if err != nil {
			return err
		}
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
	_, err := user.redis.Do("HSET", "tokens", user.Id, randToken()[:8])
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

func (user User) TouchDump() {
	user.redis.Send("HSET", "dump", user.Id, utils.TimeNow(0).Format("2006-01-02"))
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

func (user User) VerifyTmpPassword(tmpPassword string) (bool, error) {
	hashedTmpPassword, err := redis.String(user.redis.Do("GET",
		fmt.Sprintf("tmppwd:%s", user.Id)))
	if err == redis.ErrNil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return hashedTmpPassword != "" && hashedTmpPassword == user.hashPassword(tmpPassword), nil
}


func (user User) VerifyPasswordOrTmpPassword(password string) (bool, error) {

	// validate as password
	passwordOk, err := user.VerifyPassword(password)
	if err != nil {
		return false, err
	}
	if passwordOk {
		return passwordOk, nil
	}

	// or validate as temporary password
	tmpPasswordOk, err := user.VerifyTmpPassword(password)
	if err != nil {
		return false, err
	}
	if tmpPasswordOk {
		return tmpPasswordOk, nil
	}
	return false, nil
}

func (user User) NewTmpPassword() (string, error) {
	expire := 60 * 15  // 15 minutes
	tmpPassword := base64.URLEncoding.EncodeToString([]byte(randToken()[:8]))
	_, err := user.redis.Do("SETEX",
		fmt.Sprintf("tmppwd:%s", user.Id), expire, user.hashPassword(tmpPassword))
	return tmpPassword, err
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
	return Site{redis: user.redis, userId: user.Id, id: Id, db: user.db}
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


func (user User) PasswordRecovery(mailgunSecretApiKey string) error {
	mail, err := user.GetPref("mail")
	if err != nil {
		return err
	}
	tmppwd, err := user.NewTmpPassword()
	if err != nil {
		return err
	}
	mg := mailgun.NewMailgun("counter.dev", mailgunSecretApiKey)

	body := fmt.Sprintf(passwordRecoveryContent, user.Id, user.Id, tmppwd)
	message := mg.NewMessage(passwordRecoverySender, passwordRecoverSubject, body, mail)

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()

	_, _, err = mg.Send(ctx, message)

	if err != nil {
		return err
	}
	return nil
}

func (user User) SendSurvey(mailgunSecretApiKey string) error {
	mail, err := user.GetPref("mail")
	if err != nil {
		return err
	}
  if mail == "" {
    return nil
  }
	mg := mailgun.NewMailgun("counter.dev", mailgunSecretApiKey)

	body := fmt.Sprintf(surveyText, user.Id)
	message := mg.NewMessage(surveySender, surveySubject, body, mail)
  message.SetDeliveryTime(time.Now().Add(24 * 2 * time.Second))

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*30)
	defer cancel()

	_, _, err = mg.Send(ctx, message)

	if err != nil {
		return err
	}
	return nil
}


func (user User) RegisterSubscriptionID(subscriptionID string) error{
	_, err := user.redis.Do("HSET", "subscription", user.Id, subscriptionID)
	if err != nil {
		return err
	}
	return nil
}


func (user User) ReadSubscriptionID() (string, error) {
	val, err := redis.String(user.redis.Do("HGET", "subscription", user.Id))
	if err == redis.ErrNil {
		return "", nil
	} else if err != nil {
		return "", err
	}
	return val, nil
}
