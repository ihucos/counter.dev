from flask import Flask, request, render_template
app = Flask(__name__)

import redis
import json
import time
import datetime
from urllib.parse import urlparse
import hashlib

from ua_parser import user_agent_parser


r = redis.StrictRedis()



MAXSIZE = 64
MAX_ENTRIES = 20


@app.route('/unique/<id>/')
def unique(id):

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

    with r.pipeline() as pipe:
        referrer = request.args.get("referrer") # passed with javascript!!
        if referrer:
            parsed = urlparse(request.referrer)
            pipe.zincrby(f"referrer:{id}", 1, parsed.netloc[:MAXSIZE])

        ua = request.headers.get('User-Agent')
        if ua:
            pua = user_agent_parser.Parse(ua)
            os = pua['os']['family']
            browser = pua['user_agent']['family']
            pipe.zincrby(f"os:{id}", 1, os[:MAXSIZE])
            pipe.zincrby(f"browser:{id}", 1, browser[:MAXSIZE])

        # every 100s request with random
        pipe.zremrangebyrank(f"referrer:{id}", 0, -1 * MAX_ENTRIES)
        pipe.zremrangebyrank(f"os:{id}", 0, -1 * MAX_ENTRIES)
        pipe.zremrangebyrank(f"browser:{id}", 0, -1 * MAX_ENTRIES)

        pipe.hincrby(f"days:{id}", str(now.date()), 1)
        pipe.execute()

    return ''

@app.route('/', methods=["POST", "GET"])
def index():

    if request.method == "GET":
        return render_template("index.html")


    username = request.form.get("username")
    password = request.form.get("password")
    hashed_password = hashlib.sha256(password.encode()).digest()
    if not username or not password:
        return "error_missing_input"

    if request.form.get("action") == "register":
        if not r.setnx(f'user:{username}', hashed_password):
            return 'error_username_taken'
    else:
        db_hashed_password = r.get(f'user:{username}')
        if not (db_hashed_password and db_hashed_password == hashed_password):
            return 'wrong_user_or_password'
    
    #refresh_keys(username)

    with r.pipeline() as pipe:
        pipe.zrange(f"referrer:{id}", 0, 10, withscores=True)
        pipe.zrange(f"os:{id}", 0, 10, withscores=True)
        pipe.zrange(f"browser:{id}", 0, 10, withscores=True)
        pipe.hgetall(f"days:{id}")
        vals = pipe.execute()
        referrer_zet, os_zet, browser_zet, days_hash = vals
        return json.dumps(dict(
            referrer=[(i.decode(), s) for i, s in referrer_zet],
            os=[(i.decode(), s) for i, s in os_zet],
            browser=[(i.decode(), s) for i, s in browser_zet],
            days=dict((k.decode(), int(v)) for k, v in days_hash.items()),
            
        ))


app.run()
