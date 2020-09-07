import redis


r = redis.StrictRedis()

for key in r.keys("*:*:*"):
    print(key.split(b":", 3))
