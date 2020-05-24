

format:
	js-beautify --replace static/script.js
	go fmt server.go

logs:
	ssh root@172.104.148.60 cat log

deploy:
	plash --from alpine:3.11 --apk go -- go build server.go
	tar cf - keys static server | ssh root@172.104.148.60 tar xvf - -C /root
	ssh root@172.104.148.60 "pkill server; sleep 5; dtach -n /tmp/dtach ./server"


#provision:
#	ssh root@172.104.148.60 sh -c ' \
#	for i in `curl https://www.cloudflare.com/ips-v4`; do iptables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	for i in `curl https://www.cloudflare.com/ips-v6`; do ip6tables -I INPUT -p tcp -m multiport --dports http,https -s $i -j ACCEPT; done \
#	iptables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	ip6tables -A INPUT -p tcp -m multiport --dports http,https -j DROP \
#	'
#
