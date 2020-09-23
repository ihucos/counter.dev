
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
    for i in range(5000):
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


def check(s):
    domain = s
    try:
        socket.gethostbyname(domain)
    except socket.gaierror:
        pass
    else:
        return
    try:
        if not whois.query(domain):
            print(domain)
    except Exception as e:
        print(e.__class__)


for f in markow(translate(synonyms(set("analytics users web glance charts".split())))):
    check(f + ".com")
