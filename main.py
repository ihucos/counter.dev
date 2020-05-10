from flask import Flask, request, render_template, Response, redirect
from werkzeug.http import http_date
app = Flask(__name__)

import redis
import json
import time
import datetime
from urllib.parse import urlparse
import hashlib
import struct
import random
from base64 import b64encode

from device_detector import DeviceDetector
import device_detector

pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)



TRACKING_CODE='<img src="http://localhost:5000/track/{}" style="position: fixed; right: 0px; bottom: 0px"></img>'

SVG = '<?xml version="1.0" encoding="UTF-8" ?><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="1" height="1"></svg>'

STORE_AS_ZET = ["lang", "path"]
STORE_AS_HASH = ["os", "dev", "browser", "date"]

ALL_KEYS = STORE_AS_HASH + STORE_AS_ZET

MAXSIZE = 64
MAX_ZET_ENTRIES = 20
CHOICES = {
    "os": ["android", "ios", "windows", "linux"],
    "dev": ["desktop", "smartphone", "tablet"],
    "browser": ["internet explorer", "firefox", "chrome", "safari"],
}

def gen_bid():
    binary = struct.pack('<d', time.time())
    return b64encode(binary).decode().strip('=')

def to_choice(key, value):
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
    return now.date()


def get_insights(request):
    insights = {}

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

    referrer = request.headers.get("Referer")
    if referrer:
        parsed = urlparse(request.referrer)
        insights["path"] = parsed.path

    return insights



@app.route('/track/<bid>')
def track(bid):
    
    insights = get_insights(request)

    today = get_current_date(request)
    insights["date"] = str(today)
    tomorrow_date = today + datetime.timedelta(days=1)
    tomorrow_datetime = datetime.datetime.combine(tomorrow_date, datetime.time(0, 1))
    expires_at = http_date(tomorrow_datetime)

    with r.pipeline() as pipe:

        for key, value in insights.items():
            value = value[:MAXSIZE]
            if key in STORE_AS_HASH:
                pipe.hincrby(f"{key}:{bid}", value, 1)
            else:
                pipe.zincrby(f"{key}:{bid}", 1, value)

        # sometimes clean up too many zet entries
        # that code is unfortanly no tested so often :-/
        if not random.randint(0, 50):
            for key in STORE_AS_ZET:
                pipe.zremrangebyrank(f"{key}:{bid}", 0, -1 * MAX_ZET_ENTRIES)
        pipe.execute()

    resp = Response(SVG)
    resp.headers['Cache-Control'] = 'public'
    #resp.headers['Expires'] = expires_at
    resp.headers['Content-Type'] = 'image/svg+xml'
    return resp


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

        bid = gen_bid()
        with r.pipeline() as pipe:
            pipe.hsetnx(f'user:{username}', "pwhash", hashed_password)
            pipe.hsetnx(f'user:{username}', "bid", bid)
            s1, s2 = pipe.execute()
        if not s1 or not s2:
            return login_error("Username already taken")
    else:
        user = r.hgetall(f'user:{username}')
        assert hashed_password
        if  hashed_password != user.get(b"pwhash"):
            return login_error("Wrong username or password")
        bid = user[b"bid"].decode()
    
    stats = get_stats(bid)
    chart = {
            key: {'labels': list(val.keys()), 'vals': list(val.values())}
            for (key, val) in stats.items()}
    return render_template("board.html",
                username=username,
                chart=chart,
                stats=stats,
                tracking_code=TRACKING_CODE.format(bid))


def get_stats(bid):
    with r.pipeline() as pipe:
        for key in ALL_KEYS:
            if key in STORE_AS_HASH:
                pipe.hgetall(f"{key}:{bid}")
            else:
                pipe.zrange(f"{key}:{bid}", 0, MAX_ZET_ENTRIES, withscores=True)

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



if __name__ == '__main__':
    app.config["TEMPLATES_AUTO_RELOAD"] = True
    app.config["TESTING"] = True
    app.run()
