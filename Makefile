
alpineversion = 3.11
go = $(abspath ./scripts/go)


include .config/makefile*.env
export



.PHONY: devserver
devserver:
	make build
	. .config/dev.sh && ./webstats

.PHONY: tests
tests:
	. .config/test.sh && $(go) test

.PHONY: blog
blog:
	cd .pelican && pelican content

.PHONY: format
format:
	plash --from alpine:3.11 --apk npm --run 'npm i prettier --global' -- prettier --write .
	find -type f -name \*.go | xargs -L1 go fmt

.PHONY: logs
logs:
	ssh root@172.104.148.60 cat log

.PHONY: chgprodpwd
chgprodpwd:
	ssh root@172.104.148.60 python3 scripts/chgpwd.py $(user) $(password)

.PHONY: build
build:
	cd backend && $(go) build -o ../webstats

.PHONY: deploy
deploy:
	make build
	make deploy-static
	ssh root@172.104.148.60 "pkill -x dtach; sleep 5; dtach -n /tmp/dtach ./scripts/prodrun"

.PHONY: deploy-static
deploy-static:
	rsync static .config webstats scripts root@172.104.148.60: -av
	curl -X POST "https://api.cloudflare.com/client/v4/zones/$(CLOUDFLARE_ZONE1)/purge_cache" -H "Content-Type:application/json" -H "Authorization: Bearer $(CLOUDFLARE_TOKEN)" --data '{"purge_everything":true}' --fail
	curl -X POST "https://api.cloudflare.com/client/v4/zones/$(CLOUDFLARE_ZONE2)/purge_cache" -H "Content-Type:application/json" -H "Authorization: Bearer $(CLOUDFLARE_TOKEN)" --data '{"purge_everything":true}' --fail

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

out/pages/imprint.html: templates/pages/imprint.html templates/pages/base.html
	yasha -o out/pages/imprint.html --extensions templates/ext.py templates/pages/imprint.html

out/pages/privacy.html: templates/pages/privacy.html templates/pages/base.html
	yasha -o out/pages/privacy.html --extensions templates/ext.py templates/pages/privacy.html

out/pages/invest.html: templates/pages/invest.html templates/pages/base.html
	yasha -o out/pages/invest.html --extensions templates/ext.py templates/pages/invest.html


all: out/pages out/pages/imprint.html out/pages/privacy.html out/pages/invest.html


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
