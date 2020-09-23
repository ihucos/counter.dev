import fictionary
m = fictionary.Model()

for word in open("words").readlines():
    word = word[:-1]
    m.feed(word)

while True:
    print(m.random_word())
