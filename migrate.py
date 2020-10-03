
import redis
from pprint import pprint
r = redis.StrictRedis()
from urllib.parse import quote_plus


userorigins = {}

def prettyorigin(o):
    o = o.split("://")[1]
    if o.startswith("www."):
        o = o[4:]
    return o


counts = {}
for k in r.keys("*date:2020:*"):
    k = k.decode()
    dates = r.hgetall(k)
    user = k.split(':', 2)[-1]
    counts[user] = sum(int(i) for i in dates.values())

for k in r.keys("*origin:2020:*"):
    k = k.decode()
    origins = r.zrange(k, 0, -1, withscores=True)
    user = k.split(':', 2)[-1]
    origins = sorted(origins, key=lambda i: -i[1])
    biggest_origin = next(iter(origins))[0].decode()
    userorigins[user] = prettyorigin(biggest_origin)

pipe = r.pipeline(transaction=True)
ks = [b"lang", b"origin", b"ref", b"loc", b"date", b"weekday", b"platform", b"hour", b"browser", b"device", b"country", b"screen"]

for key in r.keys("*"):
    for k in ks:
        if key.startswith(k + b":"):
            kname, krange, kuser = key.decode().split(":", 2)
            try:
                site_id = userorigins[kuser]
            except KeyError:
                r.delete(key)
                continue
            newkey = "v:{site_id},{user},{field},{trange}".format(site_id=quote_plus(site_id), field=kname, trange=krange, user=quote_plus(kuser))
            pipe.rename(key.decode(), newkey)

for user, origin in userorigins.items():
    pipe.hincrby("sites:" + user, user, counts[user])


for key in r.keys("log:*"):
    _, user = key.decode().split(":", 1)
    try:
        site_id = userorigins[user]
    except KeyError:
        print("KeyError", user)
        continue
    new = "log:"+ site_id+":" + user
    pipe.rename(key, new)

pipe.execute()
