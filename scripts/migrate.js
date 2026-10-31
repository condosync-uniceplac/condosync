#!/usr/bin/env node
/* Aplica db/migrations/*.sql. Idempotente: controla o que já rodou em schema_migrations. */
const path = require('node:path');
const { applySqlDir } = require('./_db');

applySqlDir({
  dir: path.join(__dirname, '..', 'db', 'migrations'),
  table: 'schema_migrations',
  label: 'migrate',
}).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
