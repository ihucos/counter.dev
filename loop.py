from unidecode import unidecode
import fictionary

CHARS = 5








def getwords():
    for line in open("/usr/share/dict/words").readlines():
        word = line[:-1]
        if not word.isalpha():
            continue
        if len(word) != 5:
            continue

        word = unidecode(word)
        yield word

def getcandiates():
    model = fictionary.Model()
    for word in getwords():
        model.feed(word)
    while True:
        randword = model.random_word(CHARS, CHARS)
        yield randword.lower() + ".com"


def check(s):
    domain = s
    try:
        socket.gethostbyname(domain)
    except socket.gaierror:
        pass
    except Exception as exc:
        #print(exc)
        pass
    else:
        return
    try:
        if not whois.query(domain):
            print(domain)
    except Exception as e:
        pass
        #print(e.__class__)

if __name__ == '__main__':
    #for w in getcandiates():
    #    print(w)

    from multiprocessing import Pool
    with Pool(100) as p:
        p.map(check, getcandiates())



