
alpineversion = 3.11
go = ./scripts/go

.PHONY: tests
tests:
	. config/test.sh && $(go) test


.PHONY: runserver
devserver:
	 . config/dev.sh && $(go) run .

format:
	js-beautify --replace static/script.js
	js-beautify --replace static/draw.js
	$(go) fmt *.go
	$(go) fmt models/*.go

logs:
	ssh root@172.104.148.60 cat log


deploy:
	$(go) build .
	tar cf - static config webstats scripts | ssh root@172.104.148.60 tar xvf - -C /root
	ssh root@172.104.148.60 "pkill -x dtach; sleep 5; dtach -n /tmp/dtach ./scripts/prodrun"

deploy-static:
	tar cf - static scripts | ssh root@172.104.148.60 tar xvf - -C /root

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
