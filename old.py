from gevent.pywsgi import WSGIServer
import time
import os
import marshal
import hashlib
from cryptography.fernet import Fernet
import uuid

SECRET_KEY = b'O0uLwSrdRz1KLCwn4-LM4LlcdbtTL0LKfmr9UYb-8QE='



fernet = Fernet(SECRET_KEY)


SAVE_EVERY = 60 * 60 * 60 * 6

# marshal.load
datadict = {}

def hash(stri):
    return hashlib.sha224(stri.encode()).hexdigest()

def genuser():
    user = str(uuid.uuid4())
    password = user2secret(user)
    return user, password

def getuser():
    return str(uuid.uuid4())

def user2secret(user):
    return fernet.encrypt(user)

def secret2user(secret):
    return fernet.decrypt(secret)

def save(user, timestamp, counter):
    secret = user2secret(user)
    with open(os.path.join('data', secret), 'a') as file:
        file.write(f'handle_data({timestamp}, {counter});\n')

def incr(user):
    timestamp_now = int(time.time())
    init_val = (timestamp_now, 1)
    timestamp, counter = datadict.get(user, init_val)

    if timestamp + SAVE_EVERY <= timestamp_now:
        save(user, timestamp, counter)
        datadict[user] = init_val
        return

    datadict[user] = (timestamp, counter + 1)


def flush(user):
    timestamp_now = int(time.time())
    try:
        timestamp, counter = datadict[user]
    except KeyError:
        return

    if timestamp + SAVE_EVERY <= timestamp_now:
        save(user, timestamp, counter)
        del datadict[user]


def app(environ, start_response):
    argument = environ['QUERY_STRING']
    path = environ['PATH_INFO']

    if path == '/touch':
        user = environ['QUERY_STRING']
        incr(user)
        start_response('200 OK', [('Content-type', 'text/plain; charset=utf-8')])
        return [b""]
    elif path == '/flush':
        user = environ['QUERY_STRING']
        flush(user)
        start_response('200 OK', [('Content-type', 'text/plain; charset=utf-8')])
        return [b""]
    elif path == '/getuser':
        start_response('200 OK', [('Content-type', 'text/javascript; charset=utf-8')])
        user, password = genuser()
        return [f'handle_user("f{user}", "f{password}")\n'.encode()]

    start_response('404 Not Found', [('Content-type', 'text/plain; charset=utf-8')])
    return [b"Not Found\n"]

if __name__ == '__main__':
    print('Serving on 8000...')
    server = WSGIServer(('127.0.0.1', 8000), app)
    try:
        server.serve_forever()
    #except Exception as exc:
    except KeyboardInterrupt as exc:
        print(exc)
        print("found exception, dumping all to hard drive")
        for user, (timestamp, counter) in datadict.items():
            save(user, timestamp, counter)
        print('saved all')
