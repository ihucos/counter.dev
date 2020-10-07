
import redis

r = redis.StrictRedis()
p = r.pipeline(transaction=True)

for key in r.keys('v:*,simple-web-analytics*,*,*'):
    parts = key.decode().split(',')
    parts[-3] = "counter"
    p.rename(key, ','.join(parts))

p.execute()

p = r.hget('users', 'simple-web-analytics.com')
r.hset('users', 'counter', p)
r.hdel('users', 'simple-web-analytics.com')

r.rename('sites:simple-web-analytics.com', 'sites:counter')
p = r.hget('tokens', 'simple-web-analytics.com')
r.hset('tokens', 'counter', p)
r.hdel('tokens', 'simple-web-analytics.com')
