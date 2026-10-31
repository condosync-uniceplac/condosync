#!/bin/sh
# Aguarda o PostgreSQL aceitar conexões e então executa o comando recebido.
# Uso: sh scripts/wait-for-db.sh node scripts/migrate.js
# (No docker compose o depends_on: service_healthy já cobre isso; o script é
#  útil fora do compose, ex.: CI ou container de produção apontando p/ Supabase.)
set -e

TRIES="${WAIT_FOR_DB_TRIES:-30}"
i=0
until node -e "
  const { Client } = require('pg');
  const ssl = ['true','1'].includes(process.env.DB_SSL) ? { rejectUnauthorized: false } : false;
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl, connectionTimeoutMillis: 2000 });
  c.connect().then(() => c.end()).then(() => process.exit(0)).catch(() => process.exit(1));
" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge "$TRIES" ]; then
    echo "[wait-for-db] banco indisponível após $TRIES tentativas" >&2
    exit 1
  fi
  echo "[wait-for-db] aguardando banco... ($i/$TRIES)"
  sleep 2
done

echo "[wait-for-db] banco disponível"
exec "$@"
