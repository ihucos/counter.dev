import redis
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
'asdf',
]



r = redis.StrictRedis()
user_integrations = {}

for key in r.keys("v:*date,all"):
    vs= key.decode().split(':', 1)[-1].split(',')
    user = vs[1]
    date_data = r.hgetall(key)
    fst_date = min(sorted(date_data.keys())).decode()
    user_integrations.setdefault(user, [])
    user_integrations[user].append(fst_date)

user_integrated_at = {}
for user, v in user_integrations.items():
    user_integrated_at[user] = min(v)

data = []
for key in sorted(r.keys("sites:*")):
    user = key.decode().split(':', 1)[-1]
    if user in BLOCKLIST:
        continue

    token = r.hget("tokens", user)

    # no such user
    if not token:
        continue

    share_url = "http://counter.dev/app#share,{},{}".format(user, base64.b64encode(token).decode())

    integr = user_integrated_at.get(user)
    if integr:
        data.append(dict(user=user, integr=integr, share_url=share_url))


data.sort(key=lambda i: i['integr'])
for entry in data:
    print("{user:<12} {integr} {share_url}".format(**entry))

