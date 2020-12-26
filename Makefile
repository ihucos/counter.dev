
alpineversion = 3.11
go = ./scripts/go

include config/makefile.env

export

.PHONY: tests
tests:
	. config/test.sh && $(go) test


.PHONY: runserver
devserver:
	 . config/dev.sh && $(go) run .

format:
	plash --from alpine:3.11 --apk npm --run 'npm i prettier --global' -- prettier --write .
	$(go) fmt *.go
	$(go) fmt models/*.go

logs:
	ssh root@172.104.148.60 cat log

build:
	$(go) build -o webstats

deploy:
	make build
	make deploy-static
	ssh root@172.104.148.60 "pkill -x dtach; sleep 5; dtach -n /tmp/dtach ./scripts/prodrun"

deploy-static:
	rsync static config webstats scripts root@172.104.148.60: -av
	curl -X POST "https://api.cloudflare.com/client/v4/zones/$(CLOUDFLARE_ZONE1)/purge_cache" -H "Content-Type:application/json" -H "Authorization: Bearer $(CLOUDFLARE_TOKEN)" --data '{"purge_everything":true}' --fail
	curl -X POST "https://api.cloudflare.com/client/v4/zones/$(CLOUDFLARE_ZONE2)/purge_cache" -H "Content-Type:application/json" -H "Authorization: Bearer $(CLOUDFLARE_TOKEN)" --data '{"purge_everything":true}' --fail

redis-server:
	scp root@172.104.148.60:/var/lib/redis/dump.rdb /tmp/webstats-production.rdb
	plash --from alpine:$(alpineversion) --apk redis -- redis-server --dbfilename webstats-production.rdb --dir /tmp

.PHONY: log
log:
	ssh root@172.104.148.60 tail log

integrations:
	ssh root@172.104.148.60 python3 scripts/integrations.py


#provision:
#	ssh root@172.104.148.60 sh -c ' \
#	for i in `curl https://www.cloudflare.com/ips-v4`; do iptables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	for i in `curl https://www.cloudflare.com/ips-v6`; do ip6tables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	iptables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	ip6tables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	'
#
