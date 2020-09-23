from unidecode import unidecode
import fictionary
import socket
import whois



def smooth(words, badchars="kmnchzq"):
    for word in words:
        bad = False
        for char in badchars:
            if char in word:
                bad = True

        if not bad:
            yield word


def nodouble(words, ignore="o"):
    for word in words:
        last = None
        bad = False
        for char in word:
            if last == char and char not in ignore:
                bad = True
                break
            last = char
        if not bad:
            yield word


def domain(words, domain="com"):
    for word in words:
        yield word + "." + domain


def getwords():
    for line in open("/usr/share/dict/words").readlines():
        word = line[:-1]
        if not word.isalpha():
            continue
        if len(word) != 5:
            continue

        word = unidecode(word)
        yield word

def getcandiates(min=4, max=7):
    model = fictionary.Model()
    for word in getwords():
        model.feed(word)
    while True:
        randword = model.random_word(min, max)
        yield randword.lower()


def check(s):
    domain = s
    try:
        socket.gethostbyname(domain)
    except socket.gaierror:
        pass
    except Exception as exc:
        print(exc)
    else:
        return
    try:
        if not whois.query(domain):
            print(domain)
    except Exception as e:
        #print(e)
        pass

def suround(words, begin, end):
    for w in words:
        if w.startswith(begin) and w.endswith(end):
            yield w

if __name__ == '__main__':
    #for w in getcandiates():
        #print(w)

    found = suround(getcandiates(6, 8), '', 'ing')
    #for w in found:
        #print(w)

    from multiprocessing import Pool
    with Pool(10) as p:
        for d in p.imap(check, domain(found)):
            pass


    #from multiprocessing import Pool
    #with Pool(10) as p:
    #    for d in p.imap(check, domain(nodouble(smooth(getcandiates())), '')):
    #        pass



