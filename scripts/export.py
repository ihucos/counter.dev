import redis
import base64
from pprint import pprint
from urllib.parse import unquote



r = redis.StrictRedis()

def chunks(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]


# retrieve data from database
pipe = r.pipeline()
for key in r.scan_iter("v:*date,all"):
    site, user, _, _ = key.decode().split(":", 1)[-1].split(",")
    pipe.echo(unquote(user))
    pipe.echo(site)
    pipe.hgetall(key)
    pipe.hget('access', user)
    pipe.hget('dump', user)
    pipe.hget(f'prefs:{user}', 'mail')
r = pipe.execute()

# put db data in dict structure
user_data = {}
for (user, site, dates, access, dashboard_access, mail) in chunks(r, 6):
    user_data.setdefault(user, {})
    user_data[user].setdefault('sites', {})
    user_data[user]['sites'][site] = dates
    user_data[user]['access'] = access
    user_data[user]['dashboard_access'] = dashboard_access
    user_data[user]['mail'] = mail


# calculate first_date, last_date and len_data in-place
for (user, data) in user_data.items():
    all_user_dates = set([])
    hits = 0
    for dates in data['sites'].values():
        all_user_dates.update(dates)
        hits += sum(int(i) for i in dates.values())

    data['first_date'] = min(all_user_dates)
    data['last_date'] = max(all_user_dates)
    data['len_date'] = len(all_user_dates)
    data['hits'] = hits



# sort the data
user_data = {k: v for (k, v) in sorted(user_data.items(),
    key=lambda i: i[1]['first_date'])}


# print the data
print(f'''user,login,first_date,last_date,mail,hits,dashboard_access''')
for (user, d) in user_data.items():

    if b',' in user:
        continue # meh

    def f(k):
        v = d[k]
        if hasattr(v, 'decode'):
            return v.decode()
        return v

    print(f'''{user.decode()},{f('access') or ''},{f('first_date')},{f('last_date')},{f('mail' or '')},{f('hits')},{f('dashboard_access')}''')
