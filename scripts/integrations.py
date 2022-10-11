import redis
import base64


BLOCKLIST = [
]


r = redis.StrictRedis()
user_integrations = {}
user_sites = {}

for key in r.scan_iter("v:*date,all"):
    vs = key.decode().split(":", 1)[-1].split(",")
    user = vs[1]
    sites =r.hgetall("sites:" + user)
    user_sites[user] = sites
    date_data = r.hgetall(key)
    fst_date = min(sorted(date_data.keys())).decode()
    user_integrations.setdefault(user, [])
    user_integrations[user].append(fst_date)

user_integrated_at = {}
user_days_tracked = {}
for user, v in user_integrations.items():
    user_integrated_at[user] = min(v)
    user_days_tracked[user] = len(v)

data = []
for key in sorted(r.scan_iter("sites:*")):
    user = key.decode().split(":", 1)[-1]
    if user in BLOCKLIST or user.startswith("_"):
        continue

    hits = sum(int(i) for i in r.hvals("sites:{}".format(user)))


    integr = user_integrated_at.get(user)

    days_tracked = user_days_tracked.get(user)
    if integr:
        data.append(dict(hits=hits, user=user, integr=integr, sites=user_sites[user], days_tracked=days_tracked))


data.sort(key=lambda i: i["integr"])
for entry in data:
    pretty_sites = ','.join((site.decode()+':'+count.decode()) for (site, count) in entry['sites'].items())
    print("{user:<12} {integr} {hits:<6}  {days_tracked}d {pretty_sites}".format(pretty_sites=pretty_sites, **entry))
