import os, random, string, socket, fictionary
import whois


from multiprocessing import Process

out = open('out', 'a')


def rand():
    s = ''
    for i in range(6 - 1):
        s += random.choice(string.ascii_lowercase)
    return s



import fictionary
m = fictionary.Model()

for word in open("words").readlines():
    word = word[:-1]
    m.feed(word)


def doit():
    while True:
        s = m.random_word(4, 6)
        domain = s + '.ninja'
        try:
            socket.gethostbyname(domain)
        except socket.gaierror:
            pass
        else:
            continue
        try:
            if not whois.query(domain):
                print(domain)
                out.write(domain + '\n')
                out.flush()
        except Exception as e:
            print(e)


doit()
for i in range(50):
    Process(target=doit).start()
