import redis
import sqlite3
import json

redis = redis.StrictRedis()

sql = sqlite3.connect("/tmp/da.db", isolation_level=None)
sql.execute("pragma journal_mode=wal")


sql.execute("""CREATE TABLE if not exists record (key, value)""")
#sql.execute("""CREATE TABLE if not exists recorditem (record, key, count)""")

# sql.execute('CREATE INDEX if not exists record_user on record (user)')


for key in redis.scan_iter("v:*"):
    type = redis.type(key)
    if type == b"zset":
        val = redis.zrange(key, 0, -1)
    if type == b"hash":
        val = redis.hgetall(key)
    else:
        continue

    try:
        val = {k.decode(): int(v) for k, v in val.items()}
    except ValueError:
        continue

    sql.execute(
        """INSERT INTO record (key, value)
            VALUES (?, ?)""", (key, json.dumps(val)),
    )


import sys

sys.exit(0)


import redis
import sqlite3
from urllib.parse import unquote

redis = redis.StrictRedis()

sql = sqlite3.connect("/tmp/da.db", isolation_level=None)
sql.execute("pragma journal_mode=wal")


sql.execute("""CREATE TABLE if not exists record (user, site, date, field)""")
sql.execute("""CREATE TABLE if not exists recorditem (record, key, value)""")

sql.execute("CREATE INDEX if not exists record_user on record (user)")
sql.execute("CREATE INDEX if not exists record_site on record (site)")
sql.execute("CREATE INDEX if not exists record_date on record (date)")

sql.execute("CREATE INDEX if not exists recorditem_record on recorditem (record)")


for key in redis.scan_iter("v:*"):
    type = redis.type(key)
    if type == b"zset":
        val = redis.zrange(key, 0, -1)
    if type == b"hash":
        val = redis.hgetall(key)
    else:
        continue

    try:
        val = {k: int(v) for k, v in val.items()}
    except ValueError:
        continue

    site, user, field, date = (unquote(i) for i in key.decode()[len("v:") :].split(","))

    if not date.count("-") == 2:
        continue

    record_id = sql.execute(
        """INSERT INTO record (user, site, date, field)
            VALUES (?, ?, ?, ?)""",
        (user, site, date, field),
    ).lastrowid

    sql.executemany(
        "INSERT INTO recorditem (record, key, value) VALUES (?, ?, ?)",
        [(record_id, k, v) for k, v in val.items()],
    )
