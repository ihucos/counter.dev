
import redis
r = redis.StrictRedis()
p = r.pipeline()

for key in r.keys("*:*"):
    p1, p2 = key.split(b":", 1)
    p.rename(key, p1+b":all:"+p2)


p.execute()
