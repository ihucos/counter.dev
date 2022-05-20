import redis, hashlib, sys

user = sys.argv[1]
pwd = sys.argv[2]

r = redis.StrictRedis()
hashed_pwd = hashlib.sha256(pwd.encode()).digest()
r.hset('users', user, hashed_pwd)
