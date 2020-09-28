
import redis
r = redis.StrictRedis()

pipe = r.pipeline(transaction=True)
ks = [b"lang", b"origin", b"ref", b"loc", b"date", b"weekday", b"platform", b"hour", b"browser", b"device", b"country", b"screen"]

for key in r.keys("*"):
    for k in ks:
        if key.startswith(k + b":"):
            kname, krange, kuser = key.decode().split(":", 2)
            newkey = "v:all,{user},{field},{trange}".format(field=kname, trange=krange, user=kuser)
            pipe.rename(key.decode(), newkey)


for key in r.keys("log:*"):
    _, user = key.decode().split(":", 1)
    new = "log:all:" + user
    pipe.rename(key, new)

pipe.execute()
