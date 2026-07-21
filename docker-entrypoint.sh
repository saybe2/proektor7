#!/bin/sh
set -e

echo "[entrypoint] Применяем схему БД..."
CALLCHECK_SCHEMA_MARKER="/data/.callcheck-schema-v1"

if [ ! -f "$CALLCHECK_SCHEMA_MARKER" ]; then
  echo "[entrypoint] Подготавливаем временные проверки телефона..."
  node prisma/prepare-callcheck.mjs
  node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss
  touch "$CALLCHECK_SCHEMA_MARKER"
else
  node node_modules/prisma/build/index.js db push --skip-generate
fi

if [ "$RUN_SEED" = "1" ]; then
  echo "[entrypoint] Запускаем сид..."
  node prisma/seed.js || echo "[entrypoint] Сид завершился с ошибкой (возможно, уже выполнен)"
fi

echo "[entrypoint] Старт сервера..."
exec "$@"
