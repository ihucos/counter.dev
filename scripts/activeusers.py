import redis
import base64
from dateutil.parser import parse
from datetime import datetime


BLOCKLIST = [
    "counter",
    "demo",
    "zpkg",
    "test",
    "demo\\",
    "XXXXXX",
    "datest",
    "asdf",
]


r = redis.StrictRedis()
user_last_tracks = {}

for key in r.scan_iter("v:*date,all"):
    user = key.decode().split(":", 1)[-1].split(",")[1]
    date_data = r.hgetall(key)
    last_date = max(sorted(date_data.keys())).decode()
    user_last_tracks.setdefault(user, [])
    user_last_tracks[user].append(last_date)

user_last_track = {}
for user, v in user_last_tracks.items():
    date = max(v)
    user_last_track[user] = (datetime.utcnow() - parse(date)).days


active_users = len(
    list(last_track for last_track in user_last_track.values() if last_track < 7)
)

print(f"You have {active_users} active users")
