import redis
import sqlite3
from urllib.parse import unquote

redis = redis.StrictRedis()

sql = sqlite3.connect("/tmp/da.db")
sql.execute("pragma journal_mode=wal")

sql.execute(
    """CREATE TABLE if not exists record (user, site, date, field,
    UNIQUE(user, site, date, field))"""
)
sql.execute("""CREATE TABLE if not exists recorditem (record, key, value)""")

sql.execute("CREATE INDEX if not exists record_user on record (user)")
sql.execute("CREATE INDEX if not exists record_field on record (field)")
sql.execute("CREATE INDEX if not exists record_all on record (site, field)")

sql.execute("CREATE INDEX if not exists recorditem_record on recorditem (record)")


cursor = 0
while True:
    cursor, keys = redis.scan(match="v:*", cursor=cursor, count=5000)

    p = redis.pipeline()
    for key in keys:
        p.type(key)
    key_types = p.execute()

    p = redis.pipeline()
    for key, type in zip(keys, key_types):
        if type == b"hash":
            p.hgetall(key)
        elif type == b"zset":
            p.zrange(key, 0, -1, withscores=True)
        else:
            p.hgetall("__dumy_key")

    all_items = p.execute()
    for key, items in zip(keys, all_items):
        site, user, field, date = (
            unquote(i) for i in key.decode()[len("v:") :].split(",")
        )

        if not date.count("-") == 2:
            continue

        record_id = sql.execute(
            """INSERT OR IGNORE INTO record (user, site, date, field)
                VALUES (?, ?, ?, ?)""",
            (user, site, date, field),
        ).lastrowid
        sql.execute("delete from recorditem where rowid=?", [record_id])
        sql.executemany(
            "INSERT INTO recorditem (record, key, value) VALUES (?, ?, ?)",
            [(record_id, k, v) for k, v in dict(items).items()],
        )

    sql.commit()

    if cursor == 0:
        break


# asdf
#
# for key in redis.scan_iter("v:*"):
#    type = redis.type(key)
#    if type == b"zset":
#        val = redis.zrange(key, 0, -1)
#    if type == b"hash":
#        val = redis.hgetall(key)
#    else:
#        continue
#
#    try:
#        val = {k: int(v) for k, v in val.items()}
#    except ValueError:
#        continue
#
#    site, user, field, date = (unquote(i) for i in key.decode()[len("v:") :].split(","))
#
#    if not date.count("-") == 2:
#        continue
#
#    record_id = sql.execute(
#        """INSERT INTO record (user, site, date, field)
#            VALUES (?, ?, ?, ?)""",
#        (user, site, date, field),
#    ).lastrowid
#
#    sql.executemany(
#        "INSERT INTO recorditem (record, key, value) VALUES (?, ?, ?)",
#        [(record_id, k, v) for k, v in val.items()],
#    )
#
# sql.commit()

# import redis
# import sqlite3
# import json
#
# redis = redis.StrictRedis()
#
# sql = sqlite3.connect("/tmp/da.db", isolation_level=None)
# sql.execute("pragma journal_mode=wal")
#
#
# sql.execute("""CREATE TABLE if not exists record (key, value)""")
##sql.execute("""CREATE TABLE if not exists recorditem (record, key, count)""")
#
## sql.execute('CREATE INDEX if not exists record_user on record (user)')
#
#
# for key in redis.scan_iter("v:*"):
#    type = redis.type(key)
#    if type == b"zset":
#        val = redis.zrange(key, 0, -1)
#    if type == b"hash":
#        val = redis.hgetall(key)
#    else:
#        continue
#
#    try:
#        val = {k.decode(): int(v) for k, v in val.items()}
#    except ValueError:
#        continue
#
#    sql.execute(
#        """INSERT INTO record (key, value)
#            VALUES (?, ?)""", (key, json.dumps(val)),
#    )
#
#
# import sys
#
# sys.exit(0)
#
#
