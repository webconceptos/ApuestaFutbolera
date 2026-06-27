#!/bin/sh
# Despliegue manual a producción: pull, build, migraciones, reinicio.
# Corre desde la raíz del repo en el servidor de producción.
set -eu

echo "[deploy] git pull..."
git pull

echo "[deploy] docker compose up -d --build..."
docker compose --env-file .env.production up -d --build

echo "[deploy] esperando a que 'app' esté healthy..."
for i in $(seq 1 30); do
  status=$(docker inspect --format='{{.State.Health.Status}}' pollaapp-app 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    break
  fi
  sleep 2
done

echo "[deploy] aplicando migraciones..."
docker compose exec -T app npx prisma migrate deploy

echo "[deploy] listo. Logs: docker compose logs -f app"
