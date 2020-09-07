
import redis
r = redis.StrictRedis()
p = r.pipeline()

for key in list(r.keys("*:*")):
    if key.startswith(b"log:"):
        continue
    p1, p2 = key.split(b":", 1)
    dst1 = p1+b":all:"+p2
    dst2 = p1+b":2020:"+p2
    type = r.type(key).decode()

    if type  == "zset":
        val = r.zrange(key, 0, -1, withscores=True)
        for (a, b) in val:
            p.zadd(dst1, float(b), a)
            p.zadd(dst2, int(float(b)/2), a)

    elif type == "hash":
        val = r.hgetall(key)
        for (k, value) in val.items():
            p.hset(dst1, k, value)
            p.hset(dst2, k, int(int(value)/2))
    else:
        assert False, ('unexpected key type ', key, type)

    p.delete(key)


p.execute()
