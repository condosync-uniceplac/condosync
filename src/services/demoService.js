/**
 * Conta rápida de demonstração (QR code da apresentação).
 * Quem escaneia o QR informa só o nome; o sistema cria um morador temporário já aprovado,
 * num apartamento com poucos moradores, e entra direto. Regras:
 *  - só funciona com o código secreto certo (variável DEMO_CODIGO no Vercel) e até DEMO_ATE;
 *  - nome curto, só letras (aparece na tela do apresentador);
 *  - no máximo LIMITE_CONTAS contas de demonstração;
 *  - a conta é marcada como demo: "Meu perfil" fica só para leitura (ver perfilService).
 */

import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { hashPassword } from '@/lib/password';
import * as demoRepo from '@/repositories/demoRepository';
import * as termosRepo from '@/repositories/termosRepository';
import * as vinculosRepo from '@/repositories/vinculosRepository';

export const LIMITE_CONTAS = 200;
const INDISPONIVEL = 'A demonstração não está disponível no momento.';

/** A demonstração está ligada? (código configurado e dentro da validade). */
export function demoAtiva(agora = new Date()) {
  const codigo = process.env.DEMO_CODIGO;
  if (!codigo || codigo.length < 12) return false;
  const ate = process.env.DEMO_ATE ? new Date(process.env.DEMO_ATE) : null;
  return !(ate && !Number.isNaN(ate.getTime()) && agora > ate);
}

/** Compara o código do link com o configurado, em tempo constante. */
export function codigoValido(codigo) {
  const esperado = process.env.DEMO_CODIGO ?? '';
  const a = Buffer.from(String(codigo ?? ''));
  const b = Buffer.from(esperado);
  return a.length === b.length && b.length > 0 && timingSafeEqual(a, b);
}

/** CPF fictício, mas com dígitos verificadores válidos (a coluna exige 11 dígitos únicos). */
export function gerarCpf() {
  const base = Array.from(randomBytes(9), (b) => b % 10);
  const digito = (nums) => {
    const soma = nums.reduce((s, n, i) => s + n * (nums.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(base);
  const d2 = digito([...base, d1]);
  return [...base, d1, d2].join('');
}

/**
 * Cria o morador de demonstração e devolve os dados da sessão (mesmo formato do login).
 * `nome` já vem validado pelo demoSchema.
 */
export async function entrar({ codigo, nome }, { ip } = {}) {
  if (!demoAtiva() || !codigoValido(codigo)) throw new AppError(404, INDISPONIVEL);
  if ((await demoRepo.contarContasDemo()) >= LIMITE_CONTAS) {
    throw new AppError(429, 'A demonstração atingiu o limite de participantes.');
  }

  const condominioId = await demoRepo.condominioPadrao();
  const termos = await termosRepo.listVigentes();
  if (!condominioId || termos.length === 0) throw new AppError(503, INDISPONIVEL);

  // Senha aleatória que ninguém conhece: a conta só entra por esta tela.
  const senhaHash = await hashPassword(randomBytes(24).toString('base64url'));

  // CPF e e-mail são gerados; se por azar repetir (código 23505), tenta de novo.
  for (let tentativa = 0; tentativa < 3; tentativa += 1) {
    try {
      return await withTransaction(async (db) => {
        const unidadeId = await demoRepo.unidadeMenosOcupada(condominioId, db);
        const usuario = await demoRepo.criarUsuarioDemo(
          {
            nome,
            email: `demo-${randomUUID().slice(0, 13)}@demo.condosync.dev`,
            cpf: gerarCpf(),
            senhaHash,
          },
          db,
        );
        await vinculosRepo.create(
          { usuarioId: usuario.id, condominioId, perfil: 'MORADOR', unidadeId, ativo: true },
          db,
        );
        await termosRepo.registrarAceites(
          usuario.id,
          termos.map((t) => t.id),
          ip,
          db,
        );
        const [vinculo] = await vinculosRepo.listAtivosByUsuario(usuario.id, db);
        return {
          sub: String(usuario.id),
          nome: usuario.nome_completo,
          perfil: vinculo.perfil,
          vinculoId: String(vinculo.id),
          condominioId: String(vinculo.condominio_id),
          condominioNome: vinculo.condominio_nome,
          unidadeId: vinculo.unidade_id ? String(vinculo.unidade_id) : null,
          sv: vinculo.sessao_versao ?? 0,
          demo: true,
        };
      });
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }
  throw new AppError(503, INDISPONIVEL);
}
