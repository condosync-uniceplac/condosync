/**
 * Cria a conta raiz (Administrador) do condomínio — uso único, na implantação.
 * A senha NÃO é definida aqui: a conta nasce com uma senha aleatória e o
 * administrador define a dele pelo "Esqueci minha senha".
 *
 * Uso:
 *   DATABASE_URL=... node scripts/criar-admin.js \
 *     --email admin@exemplo.com --nome "Nome Completo" --cpf 52998224725 \
 *     --telefone 61999990000 --nascimento 1990-01-31 [--condominio 1]
 */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { createClient } = require('./_db');

function arg(nome) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const dados = {
    email: arg('email'),
    nome: arg('nome'),
    cpf: (arg('cpf') || '').replace(/\D/g, ''),
    telefone: (arg('telefone') || '').replace(/\D/g, ''),
    nascimento: arg('nascimento'),
    condominio: Number(arg('condominio') || 1),
  };
  for (const [k, v] of Object.entries(dados)) {
    if (!v) throw new Error(`Parâmetro obrigatório ausente: --${k}`);
  }
  const senhaAleatoria = crypto.randomBytes(24).toString('base64url');
  const hash = await bcrypt.hash(senhaAleatoria, 12);

  const client = createClient();
  await client.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO usuarios (nome_completo, email, telefone, cpf, data_nascimento, senha_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [dados.nome, dados.email, dados.telefone, dados.cpf, dados.nascimento, hash],
    );
    await client.query(
      `INSERT INTO vinculos_condominio (usuario_id, condominio_id, perfil, ativo)
       VALUES ($1, $2, 'ADMIN', true)`,
      [rows[0].id, dados.condominio],
    );
    await client.query('COMMIT');
    console.log(`[admin] conta criada para ${dados.email}.`);
    console.log('[admin] Defina a senha em /esqueci-senha usando este e-mail.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[admin] erro:', err.message);
  process.exit(1);
});
