import redis
import pandas as pd
import matplotlib.pyplot as plt
from collections import Counter
import subprocess

r = redis.StrictRedis()


res = r.hgetall("logevent:login")
logins = pd.DataFrame(
    sorted(
        (pd.Timestamp(date.decode()), int(val.decode())) for (date, val) in res.items()
    ),
)
logins = logins.set_index(0)
logins.columns = ["logins"]
logins.index.name = "date"


res = r.hgetall("logevent:register")
regs = pd.DataFrame(
    sorted(
        (pd.Timestamp(date.decode()), int(val.decode())) for (date, val) in res.items()
    ),
)
regs = regs.set_index(0)
regs.columns = ["registrations"]
regs.index.name = "date"


res = r.hgetall("v:counter.dev,counter,date,all")
visits = pd.DataFrame(
    sorted(
        (pd.Timestamp(date.decode()), int(val.decode())) for (date, val) in res.items()
    ),
)
visits = visits.set_index(0)
visits.columns = ["visits"]
visits.index.name = "visits"


out = subprocess.check_output(["python3", "scripts/integrations.py"])
counts = Counter(i.split()[1].decode() for i in out.splitlines())
integrs = pd.DataFrame((pd.Timestamp(date), count) for (date, count) in counts.items())
integrs = integrs.set_index(0)
integrs.columns = ["integrations"]
integrs.index.name = "date"


df = pd.merge(visits, logins, how="inner", left_index=True, right_index=True)
# df=pd.merge(df, integrs, how='inner', left_index=True, right_index=True)
# df=pd.merge(df, visits, how='inner', left_index=True, right_index=True)

print(df)

fig, axes = plt.subplots(nrows=4, ncols=1)

visits.plot(ax=axes[0])

pd.merge(integrs, regs, how="inner", left_index=True, right_index=True).resample(
    "W-Mon"
).sum().plot(ax=axes[1])


pd.merge(visits, logins, how="inner", left_index=True, right_index=True).resample(
    "W-Mon"
).sum().plot(ax=axes[2])


pd.merge(visits, regs, how="inner", left_index=True, right_index=True).resample(
    "W-Mon"
).sum().plot(ax=axes[3])



plt.savefig('/home/ihucos/counter.dev/stats.png', dpi=300)
plt.show()
