#!/bin/sh
# nginx resolves fastcgi_pass targets once at startup, so recreating the app
# container (a deploy) leaves it talking to a dead IP until it is restarted.
# Point nginx at the container DNS server so the variable upstream in
# default.conf is re-resolved instead.
set -e

nameserver=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf 2>/dev/null || true)

if [ -n "$nameserver" ]; then
    printf 'resolver %s valid=10s ipv6=off;\n' "$nameserver" > /etc/nginx/conf.d/00-resolver.conf
else
    : > /etc/nginx/conf.d/00-resolver.conf
fi

# Hand back to the stock nginx entrypoint (template rendering, etc.)
exec /docker-entrypoint.sh "$@"
