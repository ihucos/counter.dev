#!/bin/sh
export PLASH_EXPORT=$(printenv | cut -d= -f1 | grep 'WEBSTATS_' | xargs | tr ' ' ':')
exec plash --from alpine:3.11 --apk go -- go "$@"

