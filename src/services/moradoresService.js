import { AppError } from '@/lib/errors';
import { hashPassword } from '@/lib/password';
import { randomBytes } from 'node:crypto';
import { withTransaction } from '@/lib/db';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as usuariosRepo from '@/repositories/usuariosRepository';
import * as vinculosRepo from '@/repositories/vinculosRepository';
import { enviarConvite } from '@/services/authService';
import { unidadeDoCondominio } from '@/services/cadastrosService';

/*
 * RN.04 / RN.06 (revisão da Sprint 3) — gestão do condomínio pelo síndico.
 * - O síndico vê os moradores de cada unidade, troca o morador de unidade e
 *   encerra o vínculo de quem saiu do condomínio.
 * - A portaria não se cadastra: o síndico cria a conta e o porteiro recebe
 *   um convite por e-mail para definir a senha.
 * - Trocar de unidade ou encerrar o vínculo derruba a sessão aberta da pessoa.
 */
export const GESTAO = ['SINDICO', 'ADMIN'];

const exigirGestao = (session) => {
  if (!GESTAO.includes(session.perfil)) throw new AppError(403, 'Acesso negado.');
};

export async function listarUnidades(session) {
  exigirGestao(session);
  const [unidades, residentes] = await Promise.all([
    condominiosRepo.listUnidades(session.condominioId),
    vinculosRepo.listResidentes(session.condominioId),
  ]);
  return unidades.map((u) => ({
    id: Number(u.id),
    rotulo: `Apto ${u.numero} - Bloco ${u.bloco}`,
    bloco: u.bloco,
    moradores: residentes
      .filter((r) => String(r.unidade_id) === String(u.id))
      .map((r) => ({
        vinculoId: Number(r.id),
        nome: r.nome_completo,
        email: r.email,
        telefone: r.telefone,
        sindico: r.perfil === 'SINDICO',
      })),
  }));
}

export async function moverDeUnidade(session, vinculoId, unidadeId) {
  exigirGestao(session);
  const vinculo = await vinculosRepo.findAtivo(vinculoId, session.condominioId, [
    'MORADOR',
    'SINDICO',
  ]);
  if (!vinculo?.unidade_id) throw new AppError(404, 'Morador não encontrado.');
  if (String(vinculo.unidade_id) === String(unidadeId)) {
    throw new AppError(422, 'O morador já está nesta unidade.');
  }
  await unidadeDoCondominio(session, unidadeId);
  try {
    await vinculosRepo.definirUnidade(vinculo.id, unidadeId);
  } catch (err) {
    if (err.code === '23505') throw new AppError(409, 'Este morador já tem vínculo nesta unidade.');
    throw err;
  }
}

export async function removerMorador(session, vinculoId) {
  exigirGestao(session);
  const vinculo = await vinculosRepo.findAtivo(vinculoId, session.condominioId, [
    'MORADOR',
    'SINDICO',
  ]);
  if (!vinculo) throw new AppError(404, 'Morador não encontrado.');
  if (vinculo.perfil === 'SINDICO') {
    throw new AppError(
      409,
      'Este morador é o síndico. Transfira ou retire a função antes de removê-lo.',
    );
  }
  await vinculosRepo.encerrar(vinculo.id);
}

export async function listarPortaria(session) {
  exigirGestao(session);
  const contas = await vinculosRepo.listPortaria(session.condominioId);
  return contas.map((c) => ({
    vinculoId: Number(c.id),
    nome: c.nome_completo,
    email: c.email,
    telefone: c.telefone,
    criadoEm: c.criado_em,
  }));
}

/** Cria a conta da portaria (ativa) e envia o convite para o porteiro definir a senha. */
export async function criarPortaria(session, dados) {
  exigirGestao(session);
  const senhaHash = await hashPassword(randomBytes(24).toString('base64url'));
  let usuario;
  try {
    usuario = await withTransaction(async (db) => {
      const u = await usuariosRepo.create({ ...dados, senhaHash }, db);
      await vinculosRepo.create(
        { usuarioId: u.id, condominioId: session.condominioId, perfil: 'PORTARIA', ativo: true },
        db,
      );
      return u;
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(409, 'Já existe um cadastro com este e-mail ou CPF.');
    }
    throw err;
  }
  const convite = await enviarConvite(usuario);
  return {
    nome: usuario.nome_completo,
    email: usuario.email,
    conviteEnviado: convite.enviado,
    // Só volta o link quando o e-mail não saiu, para o síndico repassar ao porteiro
    linkConvite: convite.enviado ? null : convite.link,
  };
}

export async function desativarPortaria(session, vinculoId) {
  exigirGestao(session);
  const vinculo = await vinculosRepo.findAtivo(vinculoId, session.condominioId, ['PORTARIA']);
  if (!vinculo) throw new AppError(404, 'Conta da portaria não encontrada.');
  await vinculosRepo.encerrar(vinculo.id);
}
