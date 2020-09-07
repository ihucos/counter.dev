import redis
import datetime


utc_yesterday = datetime.datetime.utcnow() - datetime.timedelta(days=1)
utc_today = datetime.datetime.utcnow()
utc_tomorrow = datetime.datetime.utcnow() + datetime.timedelta(days=1)


keep_dates = {
    utc_yesterday.strftime("%Y"),
    utc_today.strftime("%Y"),
    utc_tomorrow.strftime("%Y"),
    utc_yesterday.strftime("%Y-%m"),
    utc_today.strftime("%Y-%m"),
    utc_tomorrow.strftime("%Y-%m"),
    utc_yesterday.strftime("%Y-%m-%d"),
    utc_today.strftime("%Y-%m-%d"),
    utc_tomorrow.strftime("%Y-%m-%d"),
}


clean_key_prefixes = {
    "lang",
    "origin",
    "ref",
    "loc",
    "date",
    "weekday",
    "platform",
    "hour",
    "browser",
    "device",
    "country",
    "screen",
}


r = redis.StrictRedis()

for key in r.scan_iter("*:*:*"):
    key_prefix, time_input, _ = key.decode().split(":", 2)
    if not time_input.replace("-", "").isnumeric():
        continue

    if not key_prefix in clean_key_prefixes:
        continue

    if not time_input in keep_dates:
        print("DRYTEST deleting", key.decode())
        # r.delete(key) # remove "DRYTEST" and then remove that this line is a comment
