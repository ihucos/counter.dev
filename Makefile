
logs:
	ssh root@simple-web-analytics.com supervisorctl tail -f webstats stderr

deploy:
	ssh root@simple-web-analytics.com 'sh -c "cd webstats && git pull && supervisorctl restart webstats"'

deploynow:
	git commit -am - --allow-empty
	git push
	make deploy
