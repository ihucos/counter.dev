
import redis
r = redis.StrictRedis()


ks = [b"lang", b"origin", b"ref", b"loc", b"date", b"weekday", b"platform", b"hour", b"browser", b"device", b"country", b"screen"]

for key in r.keys("*"):
    for k in ks:
        if key.startswith(k + b":"):
            kname, krange, kuser = key.decode().split(":", 2)
            newkey = "v:{}:example.com:{}:{}".format(kname, krange, kuser)
            print(key.decode(), newkey)

