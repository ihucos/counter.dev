import redis, hashlib, os
r = redis.StrictRedis()

salt = os.environ["WEBSTATS_PASSWORD_SALT"]


def hash(stri):
    m = hashlib.sha256()
    m.update(stri)
    return m.digest()

users =r.hgetall('users')
t = r.pipeline(transaction=True)
for user, pwd in users.items():
    t.hset("users", user, hash(pwd + salt.encode()))
t.execute()
