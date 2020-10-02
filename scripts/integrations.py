import redis
from datetime import datetime, timedelta
import base64


BLOCKLIST = [
'simple-web-analytics.com',
'demo',
'zpkg',
'test',
'demo\\',
'XXXXXX',
'datest',
'__datest',
'__test_delme_1234',
'__testdelme423',
]

def format_access(a):
    if not a:
        return '-'
    d = datetime.strptime(a, '%Y-%m-%d')
    return (datetime.today() - d).days

r = redis.Redis()
access = r.hgetall("access")
dates_around_today = [
    datetime.strftime(datetime.now() - timedelta(i), '%Y-%m-%d')
    for i in [-1, 0, 1, 2, 3, 4, 5]
]
stats = []
for key in r.keys("date:all:*"):
    user = key.decode().split(":", 2)[-1]
    if user.startswith('__'):
        continue
    if user in BLOCKLIST:
        continue
    date_data = r.hgetall(key)
    hits = sum(int(i) for i in date_data.values())
    sorted_dates = list(sorted(date_data.keys()))
    origins = r.zrange("origin:all:{}".format(user), 0, -1, withscores=True)
    origins.sort(key=lambda a: a[1])
    last_tracked = sorted_dates[-1].decode()
    active = last_tracked in dates_around_today
    token = r.hget("tokens", user)

    # no such user
    if not token:
        continue

    share_url = "http://simple-web-analytics.com/app#share,{},{}".format(user, base64.b64encode(token).decode())
    stats.append((
        user,
        "ok" if active else "",
        sorted_dates[0].decode(),
        format_access(access.get(user.encode(), b'').decode()),
        hits,
        origins[-1][0].decode() if origins else "",
        share_url))

stats.sort(key=lambda i: i[2])

print("user                         active integrated login hits     sites")
for line in stats:
    print("{:<32} {:<2} {} {:<5} {:<8,} {:<32} {}".format(*line))
