

format:
	js-beautify --replace static/script.js
	go fmt server.go

logs:
	ssh root@172.104.148.60 cat log

deploy:
	plash --from alpine:3.11 --apk go -- go build server.go
	tar cf - static server | ssh root@172.104.148.60 tar xvf - -C /root
	ssh root@172.104.148.60 "pkill -x ./server; sleep 5; dtach -n /tmp/dtach ./server"

deploy-static:
	tar cf - static | ssh root@172.104.148.60 tar xvf - -C /root

stats:
	echo "=== all users ==="
	echo "hkeys users" | ssh root@172.104.148.60 redis-cli
	echo ""
	echo "=== integrated users ==="
	echo "keys date:*" | ssh root@172.104.148.60 redis-cli | cut -d: -f2


redis-server:
	scp root@172.104.148.60:/var/lib/redis/dump.rdb /tmp/webstats-production.rdb
	plash --from alpine:3.11 --apk redis -- redis-server --dbfilename webstats-production.rdb --dir /tmp

.PHONY: log
log:
	ssh root@172.104.148.60 tail log

integrations:
	python3 scripts/integrations.py

#provision:
#	ssh root@172.104.148.60 sh -c ' \
#	for i in `curl https://www.cloudflare.com/ips-v4`; do iptables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	for i in `curl https://www.cloudflare.com/ips-v6`; do ip6tables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	iptables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	ip6tables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	'
#
