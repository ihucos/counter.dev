
alpineversion = 3.11
gofiles = src/run.go src/ctx.go src/endpoints.go src/app.go src/config.go
go = plash --from alpine:$(alpineversion) --apk go -- go

.PHONY: tests
tests:
	$(go) test $(gofiles) src/config_tests.go src/main_test.go


.PHONY: runserver
runserver:
	 $(go) run  $(gofiles) src/config_devel.go

format:
	js-beautify --replace static/script.js
	js-beautify --replace static/draw.js
	$(go) fmt *.go

logs:
	ssh root@172.104.148.60 cat log


deploy:
	$(go) build $(gofiles) src/config_production.go
	tar cf - static run | ssh root@172.104.148.60 tar xvf - -C /root
	ssh root@172.104.148.60 "pkill -x ./run; sleep 5; dtach -n /tmp/dtach ./run"

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
