#!/usr/bin/env bash
set -euo pipefail
image=${1:?Pass the application image}
prefix="modulo-backup-test-$(date +%s)-$RANDOM"
cleanup() {
  docker rm -f "$prefix-app" "$prefix-db" >/dev/null 2>&1 || true
  docker network rm "$prefix" >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker network create "$prefix" >/dev/null
password=$(openssl rand -hex 32)
docker run -d --name "$prefix-db" --network "$prefix" --network-alias db \
  -e POSTGRES_DB=modulo_backup_rehearsal -e POSTGRES_USER=modulo_backup_rehearsal \
  -e "POSTGRES_PASSWORD=$password" public.ecr.aws/docker/library/postgres:16.15-alpine >/dev/null
for _ in $(seq 1 40); do
  if docker exec "$prefix-db" pg_isready -h 127.0.0.1 -U modulo_backup_rehearsal -d modulo_backup_rehearsal >/dev/null 2>&1; then break; fi
  sleep 1
done
docker run --rm --name "$prefix-app" --network "$prefix" --entrypoint php \
  -e MODULO_BACKUP_REHEARSAL=1 -e APP_ENV=testing -e "APP_KEY=base64:$(openssl rand -base64 32)" \
  -e DB_CONNECTION=pgsql -e DB_HOST=db -e DB_PORT=5432 \
  -e DB_DATABASE=modulo_backup_rehearsal -e DB_USERNAME=modulo_backup_rehearsal -e "DB_PASSWORD=$password" \
  -e CACHE_STORE=array -e SESSION_DRIVER=file -e QUEUE_CONNECTION=sync \
  "$image" scripts/test-backup-roundtrip.php
