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


@app.route('/unique/<uid>/')
def unique(uid):

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
            pipe.zincrby(f"referrer:{uid}", 1, parsed.netloc[:MAXSIZE])
        else:
            pipe.zincrby(f"referrer:{uid}", 1, "direct")

        ua = request.headers.get('User-Agent')
        if ua:
            pua = user_agent_parser.Parse(ua)
            os = pua['os']['family']
            browser = pua['user_agent']['family']
            pipe.zincrby(f"os:{uid}", 1, os[:MAXSIZE])
            pipe.zincrby(f"browser:{uid}", 1, browser[:MAXSIZE])

        # every 100s request with random
        pipe.zremrangebyrank(f"referrer:{uid}", 0, -1 * MAX_ENTRIES)
        pipe.zremrangebyrank(f"os:{uid}", 0, -1 * MAX_ENTRIES)
        pipe.zremrangebyrank(f"browser:{uid}", 0, -1 * MAX_ENTRIES)

        # every 10s request iwth random
        #refresh_keys(username)

        pipe.hincrby(f"days:{uid}", str(now.date()), 1)
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
        pipe.hgetall(f"days:{username}")
        vals = pipe.execute()
        referrer_zet, os_zet, browser_zet, days_hash = vals

    templ_args = dict(
      ref_labels=[i.decode() for (i, _) in referrer_zet],
      ref_values=[i for (_, i) in referrer_zet],

      os_labels=[i.decode() for (i, _) in os_zet],
      os_values=[i for (_, i) in os_zet],

      browser_labels=[i.decode() for (i, _) in browser_zet],
      browser_values=[i for (_, i) in browser_zet],
    
    )
    #referrer={i.decode(): s for i, s in referrer_zet},
    #os={i.decode(): s for i, s in os_zet},
    #browser={i.decode(): s for i, s in browser_zet},
    #days={k.decode(): int(v) for k, v in days_hash.items()},

    return render_template("board.html",
                username=username,
                **templ_args)


app.run()
