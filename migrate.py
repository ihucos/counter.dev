
import redis
r = redis.StrictRedis()



userorigins = {}

def prettyorigin(o):
    o = o.split("://")[1]
    if o.startswith("www."):
        o = o[4:]
    return o


for k in r.keys("*origin:2020:*"):
    k = k.decode()
    origins = r.zrange(k, 0, -1, withscores=True)
    user = k.split(':')[-1]
    origins = sorted(origins, key=lambda i: -i[1])
    biggest_origin = next(iter(origins))[0].decode()
    userorigins[user] = prettyorigin(biggest_origin)

print(userorigins)

pipe = r.pipeline(transaction=True)
ks = [b"lang", b"origin", b"ref", b"loc", b"date", b"weekday", b"platform", b"hour", b"browser", b"device", b"country", b"screen"]

for key in r.keys("*"):
    for k in ks:
        if key.startswith(k + b":"):
            kname, krange, kuser = key.decode().split(":", 2)
            try:
                site_id = userorigins[kuser]
            except KeyError:
                print("KeyError", kuser)
                continue
            newkey = "v:{site_id},{user},{field},{trange}".format(site_id=site_id, field=kname, trange=krange, user=kuser)
            pipe.rename(key.decode(), newkey)


for key in r.keys("log:*"):
    _, user = key.decode().split(":", 1)
    new = "log:all:" + user
    pipe.rename(key, new)

#pipe.execute()
