
alpineversion = edge
go = $(abspath ./scripts/go)

.DEFAULT_GOAL := all

include .config/makefile*.env
export


.PHONY: devserver
devserver:
	make build
	plash --from alpine:$(alpineversion) -- sh -c ". .config/dev.sh && exec ./webstats"

.PHONY: tests
tests:
	. .config/test.sh && $(go) test

.PHONY: format
format:
	plash --from alpine:$(alpineversion) --apk npm --run 'npm i prettier --global' -- prettier --write .
	find -type f -name \*.go | xargs -L1 go fmt

.PHONY: logs
logs:
	ssh root@172.104.148.60 cat log

.PHONY: logs
get-newsletter-subscriptions:
	ssh root@172.104.148.60 scripts/get-newsletter-subscriptions

.PHONY: chgprodpwd
chgprodpwd:
	ssh root@172.104.148.60 '. .config/production.sh && python3 scripts/chgpwd.py $(user) $(password)'

.PHONY: build
build:
	cd backend && GOOS=linux GOARCH=amd64 $(go) build -o ../webstats

.PHONY: deploy
deploy:
	make build
	rsync .config webstats scripts root@172.104.148.60: -av
	ssh root@172.104.148.60 "pkill -x dtach; sleep 5; dtach -n /tmp/dtach ./scripts/prodrun"

.PHONY: redis-server
redis-server:
	scp root@172.104.148.60:/var/lib/redis/dump.rdb /tmp/webstats-production.rdb
	plash --from alpine:$(alpineversion) --apk redis -- redis-server --dbfilename webstats-production.rdb --dir /tmp

.PHONY: log
log:
	ssh root@172.104.148.60 tail log

.PHONY: integrations
integrations:
	ssh root@172.104.148.60 python3 scripts/integrations.py


out/blog: templates/blog/* $(shell find posts)
	mkdir -p out/blog
	cd .pelican && pelican content
	touch out/blog # mark as done


out/pages/imprint.html: templates/pages/imprint.html templates/pages/base.html
	yasha -o out/pages/imprint.html --extensions templates/ext.py templates/pages/imprint.html

out/pages/privacy.html: templates/pages/privacy.html templates/pages/base.html
	yasha -o out/pages/privacy.html --extensions templates/ext.py templates/pages/privacy.html

out/pages/invest.html: templates/pages/invest.html templates/pages/base.html
	yasha -o out/pages/invest.html --extensions templates/ext.py templates/pages/invest.html


all: out/pages out/blog out/pages/imprint.html out/pages/privacy.html out/pages/invest.html


.PHONY: clean
clean:
	rm -rf out

out/pages:
	mkdir -p out/pages



# Snippset needed when setting counter.dev up in new servers
#provision:
#	ssh root@172.104.148.60 sh -c ' \
#	for i in `curl https://www.cloudflare.com/ips-v4`; do iptables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	for i in `curl https://www.cloudflare.com/ips-v6`; do ip6tables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	iptables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	ip6tables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	'
#
