from flask import Flask, request, render_template
app = Flask(__name__)

import redis
import json
import time
import datetime
from urllib.parse import urlparse
import hashlib

from device_detector import DeviceDetector


r = redis.StrictRedis()


ALL_KEYS = ["os", "dev", "browser", "date", "lang", "ref", "path"]
STORE_AS_HASH = ["os", "dev", "browser", "date"]

MAXSIZE = 64
MAX_ZET_ENTRIES = 20
CHOICES = {
    "os": ["android", "ios", "windows", "linux"],
    "dev": ["desktop", "smartphone", "tablet"],
    "browser": ["internet explorer", "firefox", "chrome", "safari"],
}


def to_choice(key, value):
    print(key, value)
    if value.lower() in CHOICES[key]:
        return value
    return "Other"

def get_current_date(request):
    utcoffset = request.args.get('utcoffset', '')
    try:
        utcoffset = int(utcoffset)
    except ValueError:
        utcoffset = 0

    # bound check
    utcoffset = max(utcoffset, -12)
    utcoffset = min(utcoffset, 12)

    now = datetime.datetime.utcnow()
    now += datetime.timedelta(hours=utcoffset)
    date = str(now.date())
    return date


def get_insights(request):
    insights = {}

    insights["date"] = get_current_date(request)

    ua = request.headers.get('User-Agent')
    if ua:
        pua = DeviceDetector(ua).parse()
        insights["browser"] = to_choice("browser", pua.client_name())
        insights["dev"] = to_choice("dev", pua.device_type())
        insights["os"] = to_choice("os", pua.os_name())

    if request.accept_languages:
        al = sorted(request.accept_languages, key=lambda x: x[1], reverse=True)[0][0]
        al = al.split('-')[0]
        insights["lang"] = al

    referrer = request.args.get("referrer") # passed with javascript!!
    if referrer:
        parsed = urlparse(request.referrer)
        insights["ref"] = parsed.netloc

    referrer = request.headers.get("Referer")
    if referrer:
        parsed = urlparse(request.referrer)
        insights["path"] = parsed.path

    return insights




@app.route('/unique/<uid>/')
def unique(uid):
    
    insights = get_insights(request)

    with r.pipeline() as pipe:

        for key, value in insights.items():
            value = value[:MAXSIZE]
            if key in STORE_AS_HASH:
                pipe.hincrby(f"{key}:{uid}", value, 1)
            else:
                pipe.zincrby(f"{key}:{uid}", 1, value)

        ## every 100s request with random
        #pipe.zremrangebyrank(f"referrer:{uid}", 0, -1 * MAX_ZET_ENTRIES)
        #pipe.zremrangebyrank(f"os:{uid}", 0, -1 * MAX_ZET_ENTRIES)
        #pipe.zremrangebyrank(f"browser:{uid}", 0, -1 * MAX_ZET_ENTRIES)

        ## every 10s request iwth random
        ##refresh_keys(username)

        pipe.execute()

    return ''

@app.route('/', methods=["POST", "GET"])
def index():

    if request.method == "GET":
        return render_template("index.html")


    username = request.form.get("username")
    password = request.form.get("password")
    hashed_password = hashlib.sha256(password.encode()).digest()


    login_error = lambda msg: render_template("index.html",
                error=msg,
                username=username)

    if not username or not password:
        return login_error("Missing Input")

    if request.form.get("action") == "register":

        if len(username) < 4:
            return login_error("Username needs at least 4 charachters")

        if len(password) < 8:
            return login_error("Password needs at least 8 charachters")

        if not r.setnx(f'user:{username}', hashed_password):
            return login_error("Username already taken")
    else:
        db_hashed_password = r.get(f'user:{username}')
        if not (db_hashed_password and db_hashed_password == hashed_password):
            return login_error("Wrong username or password")
    
    stats = get_stats(username)
    chart = {
            key: {'labels': list(val.keys()), 'vals': list(val.values())}
            for (key, val) in stats.items()}
    return render_template("board.html",
                username=username,
                chart=chart)


def get_stats(uid):
    with r.pipeline() as pipe:
        for key in ALL_KEYS:
            if key in STORE_AS_HASH:
                pipe.hgetall(f"{key}:{uid}")
            else:
                pipe.zrange(f"{key}:{uid}", 0, MAX_ZET_ENTRIES, withscores=True)

        vals = pipe.execute()

    normal_vals = []
    for val in vals:
        if isinstance(val, list):
            normal_vals.append({fst.decode(): int(snd) for (fst, snd) in val})
        elif isinstance(val, dict):
            normal_vals.append({fst.decode(): int(snd) for (fst, snd) in val.items()})
        else:
            assert False, "got unexpected python type from redis"

    return dict(zip(ALL_KEYS, normal_vals))



app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["TESTING"] = True
app.run()
