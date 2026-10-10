#!/usr/bin/env bash
# Verify fresh initialization, privilege drop, restart and dump/restore in isolation.
set -euo pipefail
image=${1:?Pass the database image}
name="modulo-database-test-$(date +%s)-$RANDOM"
volume="$name-data"
directory=$(mktemp -d /tmp/modulo-database-test.XXXXXX)
cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
  rm -f "$directory/database.dump"
  rmdir "$directory"
}
trap cleanup EXIT
docker volume create "$volume" >/dev/null
docker run -d --name "$name" --network none -v "$volume:/var/lib/postgresql/data" \
  -e POSTGRES_USER=modulo_image_test -e POSTGRES_DB=modulo_image_test \
  -e "POSTGRES_PASSWORD=$(openssl rand -hex 32)" "$image" >/dev/null
ready() {
  for _ in $(seq 1 40); do
    # Initialization temporarily starts a socket-only server while PID 1 is
    # still the root entrypoint. Wait for the final TCP-listening server.
    if docker exec "$name" pg_isready -h 127.0.0.1 -U modulo_image_test -d modulo_image_test >/dev/null 2>&1; then return; fi
    sleep 1
  done
  docker logs "$name"
  return 1
}
ready
docker exec "$name" sh -ec 'test "$(awk "/^Uid:/ {print \$2}" /proc/1/status)" = "$(id -u postgres)"'
docker exec "$name" psql -v ON_ERROR_STOP=1 -U modulo_image_test -d modulo_image_test \
  -c "CREATE TABLE persistence_probe (value text); INSERT INTO persistence_probe VALUES ('preserved');"
docker exec "$name" pg_dump -U modulo_image_test -d modulo_image_test --format=custom > "$directory/database.dump"
docker restart "$name" >/dev/null
ready
test "$(docker exec "$name" psql -At -U modulo_image_test -d modulo_image_test -c 'SELECT value FROM persistence_probe')" = preserved
docker exec "$name" createdb -U modulo_image_test restored_probe
docker exec -i "$name" pg_restore --exit-on-error --no-owner -U modulo_image_test -d restored_probe < "$directory/database.dump"
test "$(docker exec "$name" psql -At -U modulo_image_test -d restored_probe -c 'SELECT value FROM persistence_probe')" = preserved
docker exec "$name" postgres --version
echo 'DATABASE_IMAGE_OK: initialization, privilege drop, restart, dump and restore'
