
import openai
import tempfile
import re
import subprocess
from pprint import pprint

openai.api_key = "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"

patches = subprocess.check_output('git log -p'.split()).decode()

lst = []
now = ""
for line in patches.splitlines():
    if line.startswith("commit "):
        if now:
            lst.append(now)
        lst.append(now)
        now = line
    else:
        now += line

messages = []
for l in reversed(lst):
    messages.append({"role": "user", "content": 'next diff'})
    messages.append({"role": "system", "content": l})

messages.append({"role": "user", "content": 'next diff'})

completion = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    # temperature=1.5,
    messages=messages[:20],
)

resp = completion["choices"][0]["message"]["content"]
print(resp)
