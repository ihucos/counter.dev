import redis, hashlib, sys, os

user = sys.argv[1]
pwd = sys.argv[2]
salt = os.environ["WEBSTATS_PASSWORD_SALT"]

r = redis.StrictRedis()

hashed_pwd = hashlib.sha256(
    hashlib.sha256(pwd.encode()).digest() + salt.encode()
).digest()
r.hset("users", user, hashed_pwd)
