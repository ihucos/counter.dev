import redis
from datetime import datetime, timedelta


BLOCKLIST = [
'simple-web-analytics.com',
'demo',
'zpkg',
'test',
'demo\\',
'datest',
'__datest',
'__test_delme_1234',
]

r = redis.Redis()
access = r.hgetall("access")
dates_around_today = [
    datetime.strftime(datetime.now() - timedelta(i), '%Y-%m-%d')
    for i in [-1, 0, 1, 2, 3, 4, 5]
]
stats = []
for key in r.keys("date:*"):
    user = key.decode().split(":", 1)[-1]
    if user in BLOCKLIST:
        continue
    date_data = r.hgetall(key)
    hits = sum(int(i) for i in date_data.values())
    sorted_dates = list(sorted(date_data.keys()))
    origins = r.zrange("origin:{}".format(user), 0, -1, withscores=True)
    origins.sort(key=lambda a: a[1])
    last_tracked = sorted_dates[-1].decode()
    active = last_tracked in dates_around_today
    stats.append((
        user,
        "ok" if active else "",
        sorted_dates[0].decode(),
        access.get(user.encode(), b"0000-00-00").decode(),
        hits,
        origins[-1][0].decode() if origins else ""))

stats.sort(key=lambda i: i[2])

print("user                         active integrated login      hits     sites")
for line in stats:
    print("{:<32} {:<2} {} {} {:<8,} {}".format(*line))
