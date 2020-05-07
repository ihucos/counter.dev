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


STORE_AS_HASH = ["os", "dev", "browser", "date"]
MAXSIZE = 64
MAX_ENTRIES = 20
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
        insights["refd"] = parsed.netloc
        insights["refp"] = parsed.path

    return insights




@app.route('/unique/<uid>/')
def unique(uid):
    
    insights = get_insights(request)

    with r.pipeline() as pipe:

        for key, value in insights.items():
            if key in STORE_AS_HASH:
                pipe.hincrby(f"{key}:{uid}", value, 1)
            else:
                pipe.zincrby(f"{key}:{uid}", 1, value)

        ## every 100s request with random
        #pipe.zremrangebyrank(f"referrer:{uid}", 0, -1 * MAX_ENTRIES)
        #pipe.zremrangebyrank(f"os:{uid}", 0, -1 * MAX_ENTRIES)
        #pipe.zremrangebyrank(f"browser:{uid}", 0, -1 * MAX_ENTRIES)

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
    
    #refresh_keys(username)

    with r.pipeline() as pipe:
        pipe.zrange(f"referrer:{username}", 0, 10, withscores=True)
        pipe.zrange(f"os:{username}", 0, 10, withscores=True)
        pipe.zrange(f"browser:{username}", 0, 10, withscores=True)
        pipe.zrange(f"lang:{username}", 0, 10, withscores=True)
        pipe.zrange(f"dev:{username}", 0, 10, withscores=True)
        pipe.hgetall(f"days:{username}")
        vals = pipe.execute()
        referrer_zet, os_zet, browser_zet, lang_zet, dev_zet, days_hash = vals

    if days_hash:
        fst_day = min(days_hash.keys())
        day = datetime.datetime.strptime(fst_day.decode(), "%Y-%m-%d")
        day_before = str((day - datetime.timedelta(days=1)).date())
        days_hash[day_before.encode()] = 0

    days_hash = dict(sorted(days_hash.items()))

    templ_args = dict(
      ref_labels=[i.decode() for (i, _) in referrer_zet],
      ref_values=[i for (_, i) in referrer_zet],

      os_labels=[i.decode() for (i, _) in os_zet],
      os_values=[i for (_, i) in os_zet],

      browser_labels=[i.decode() for (i, _) in browser_zet],
      browser_values=[i for (_, i) in browser_zet],

      lang_labels=[i.decode() for (i, _) in lang_zet],
      lang_values=[i for (_, i) in lang_zet],

      dev_labels=[i.decode() for (i, _) in dev_zet],
      dev_values=[i for (_, i) in dev_zet],

      days_labels=[k for (k, v) in days_hash.items()],
      days_values=[v for (k, v) in days_hash.items()],
    
    )

    return render_template("board.html",
                username=username,
                **templ_args)


app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["TESTING"] = True
app.run()
