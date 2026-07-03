#!/bin/sh
set -e

echo "[entrypoint] Применяем схему БД..."
node node_modules/prisma/build/index.js db push --skip-generate

if [ "$RUN_SEED" = "1" ]; then
  echo "[entrypoint] Запускаем сид..."
  node prisma/seed.js || echo "[entrypoint] Сид завершился с ошибкой (возможно, уже выполнен)"
fi

echo "[entrypoint] Старт сервера..."
exec "$@"
