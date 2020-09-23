
from googletrans import Translator
import sys, unidecode
from unidecode import unidecode
import fictionary
import socket
import whois
from nltk.corpus import wordnet

#langs = sys.argv[1].split(',')
#words = sys.argv[2].split(',')

translator = Translator()

def smooth(words, badchars="kmnchzq"):
    new = set([])
    for word in words:
        bad = False
        for char in badchars:
            if char in randword:
                bad = True

        if not bad:
            new.add(randword)
    print("smooth", new)
    return new


def nodouble(words, ignore="o"):
    new = set([])
    for word in words:
        last = None
        for char in word:
            if last == char and char not in ignore:
                bad = True
                break
            last = char
        new.add(word)
    print("nodouble", new)
    return new

    
    

def markow(words, min=4, max=7):
    model = fictionary.Model()
    for word in words:
        model.feed(word)
    new = set({})
    for i in range(50000):
        try:
            randword = model.random_word(min, max)
        except Exception:
            continue
        new.add(randword)
    print("markow:", new)
    return new
    


def synonyms(words):
    new = set([])
    for word in list(words):
        new.add(word)
        for i in wordnet.synsets(word):
            more = i.lemma_names()
            for m in more:
                if not "_" in m:
                    new.add(m.lower())
    print("synonyms:", new)
    return new.union(words)



def translate(words, langs=["de", "en", "es"], src="en"):
    new = set([])
    for lang in langs:
        for word in words:
            t = translator.translate(word, dest=lang, src=src).text
            #if unidecode(t) == t and ' ' not in t:
            t = unidecode(t.lower().replace(' ', '').replace("'", ''))
            new.add(t)
    print("translate:", new)
    return new

def domain(words, domain="com"):
    for word in words:
        yield word + "." + domain


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

def take(func, words, times):
    if times == 0:
        return words
    morewords = func(words)
    return take(func, morewords, times - 1)


if __name__ == '__main__':
    words = set(sys.argv[2:])
    print(words)
    tocheck = eval(sys.argv[1])

    #for f in sorted(tocheck):
    #    check(f + ".com")
    
    
    from multiprocessing import Pool
    with Pool(100) as p:
        p.map(check, sorted(domain(tocheck)))
