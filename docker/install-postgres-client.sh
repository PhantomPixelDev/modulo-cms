#!/bin/sh
# Use the server's major version: newer pg_dump output is not backward compatible.
set -eu
apt-get update
apt-get install -y --no-install-recommends curl ca-certificates
install -d /usr/share/postgresql-common/pgdg
curl --fail --silent --show-error --location --retry 3 \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc
echo '0144068502a1eddd2a0280ede10ef607d1ec592ce819940991203941564e8e76  /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc' | sha256sum -c -
. /etc/os-release
printf 'deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt %s-pgdg main\n' "$VERSION_CODENAME" > /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y --no-install-recommends postgresql-client-16
# Select the installed 16 binaries explicitly, even if another client is present.
ln -sf /usr/lib/postgresql/16/bin/pg_dump /usr/local/bin/pg_dump
ln -sf /usr/lib/postgresql/16/bin/psql /usr/local/bin/psql
pg_dump --version | grep ' 16\.'
psql --version | grep ' 16\.'
