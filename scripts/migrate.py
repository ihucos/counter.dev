
import redis
from uuid import uuid4

r = redis.StrictRedis()


for user in r.hkeys('users'):
    u = str(uuid4())
    r.hset('uuid2id', u, user)
    r.hset('id2uuid', user, u)
