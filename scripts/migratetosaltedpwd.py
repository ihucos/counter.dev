import redis, hashlib, os
r = redis.StrictRedis()

salt = os.environ["WEBSTATS_PASSWORD_SALT"]


def hash(stri):
    m = hashlib.sha256()
    m.update(stri)
    return m.digest()

users =r.hgetall('users')
for user, pwd in users.items():
    r.hset("users", user, hash(pwd + salt.encode()))

