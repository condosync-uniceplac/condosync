#!/usr/bin/env node
/*
 * Aplica db/seeds/*.sql (dados de DESENVOLVIMENTO). Controlado por schema_seeds,
 * então rodar de novo não duplica dados. Recusa rodar em produção.
 */
const path = require('node:path');
const { applySqlDir } = require('./_db');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
  console.error(
    '[seed] bloqueado em NODE_ENV=production (os dados são apenas para desenvolvimento).',
  );
  process.exit(1);
}

applySqlDir({
  dir: path.join(__dirname, '..', 'db', 'seeds'),
  table: 'schema_seeds',
  label: 'seed',
}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
