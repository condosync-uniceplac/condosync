import { createHash, randomBytes } from 'node:crypto';
import { withTransaction } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signSession } from '@/lib/auth';
import * as usuariosRepo from '@/repositories/usuariosRepository';
import * as vinculosRepo from '@/repositories/vinculosRepository';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as termosRepo from '@/repositories/termosRepository';
import * as recuperacoesRepo from '@/repositories/recuperacoesSenhaRepository';
import * as tentativasRepo from '@/repositories/tentativasLoginRepository';

const LOGIN_INVALIDO = 'Credenciais inválidas.';
const MAX_TENTATIVAS = 5;
const JANELA_TENTATIVAS_MIN = 15;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Cadastro de usuário + vínculo com o condomínio + aceite dos termos vigentes.
 * Todo vínculo nasce pendente (inativo) e precisa ser aprovado pelo síndico,
 * inclusive o de morador (versão 2: evita acesso de quem não é do condomínio).
 */
export async function register(data, { ip } = {}) {
  let condominioId = data.condominioId;
  let unidadeId = data.unidadeId ?? null;

  if (unidadeId) {
    const unidade = await condominiosRepo.findUnidade(unidadeId);
    if (!unidade || (condominioId && Number(unidade.condominio_id) !== condominioId)) {
      throw new AppError(422, 'Dados inválidos.', { unidadeId: 'Unidade não encontrada.' });
    }
    condominioId = Number(unidade.condominio_id);
  } else if (!(await condominiosRepo.findById(condominioId))) {
    throw new AppError(422, 'Dados inválidos.', { condominioId: 'Condomínio não encontrado.' });
  }

  const termos = await termosRepo.listVigentes();
  const tipos = new Set(termos.map((t) => t.tipo));
  if (!tipos.has('TERMOS_USO') || !tipos.has('POLITICA_PRIVACIDADE')) {
    throw new AppError(503, 'Termos de Uso/Política de Privacidade não configurados.');
  }

  const senhaHash = await hashPassword(data.senha);

  try {
    return await withTransaction(async (client) => {
      const usuario = await usuariosRepo.create({ ...data, senhaHash }, client);
      const vinculo = await vinculosRepo.create(
        {
          usuarioId: usuario.id,
          condominioId,
          perfil: data.perfil,
          unidadeId,
          ativo: false,
        },
        client,
      );
      await termosRepo.registrarAceites(
        usuario.id,
        termos.map((t) => t.id),
        ip,
        client,
      );
      return {
        id: Number(usuario.id),
        nome: usuario.nome_completo,
        email: usuario.email,
        perfil: vinculo.perfil,
        acessoLiberado: vinculo.ativo,
      };
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new AppError(409, 'Já existe um cadastro com este e-mail ou CPF.');
    }
    throw err;
  }
}

/**
 * Login por e-mail ou CPF ({ tipo, valor } já normalizados pelo loginSchema).
 * Após MAX_TENTATIVAS falhas na janela de tempo, o identificador fica bloqueado
 * temporariamente (mesma resposta exista ou não a conta).
 */
export async function login({ tipo, valor, senha }, { ip } = {}) {
  const identificador = `${tipo}:${valor}`;
  const falhas = await tentativasRepo.contarFalhasRecentes(identificador, JANELA_TENTATIVAS_MIN);
  if (falhas >= MAX_TENTATIVAS) {
    throw new AppError(
      429,
      `Muitas tentativas de acesso. Tente novamente em ${JANELA_TENTATIVAS_MIN} minutos.`,
    );
  }

  const usuario = await usuariosRepo.findForLogin({ tipo, valor });
  // Sempre roda o bcrypt (mesmo sem usuário) para não revelar cadastros pelo tempo de resposta
  const senhaOk = await verifyPassword(senha, usuario?.senha_hash);

  if (!usuario || !senhaOk || !usuario.ativo) {
    await tentativasRepo.registrarFalha(identificador, ip);
    throw new AppError(401, LOGIN_INVALIDO);
  }
  await tentativasRepo.limpar(identificador);

  const [vinculo] = await vinculosRepo.listAtivosByUsuario(usuario.id);
  if (!vinculo) {
    // Credenciais já conferidas: aqui é seguro ser específico
    throw new AppError(403, 'Seu cadastro ainda está aguardando a aprovação do síndico.');
  }

  const sessao = {
    sub: String(usuario.id),
    nome: usuario.nome_completo,
    perfil: vinculo.perfil,
    vinculoId: String(vinculo.id),
    condominioId: String(vinculo.condominio_id),
    condominioNome: vinculo.condominio_nome,
    unidadeId: vinculo.unidade_id ? String(vinculo.unidade_id) : null,
  };
  const token = await signSession(sessao);
  return { token, usuario: { id: sessao.sub, nome: sessao.nome, perfil: sessao.perfil } };
}

/**
 * Gera um token de redefinição de senha (guardado como SHA-256).
 * Sempre termina sem erro para não revelar se o e-mail existe.
 * TODO: enviar o link `${APP_URL}/redefinir-senha?token=...` por e-mail.
 */
export async function requestPasswordReset({ email }) {
  const usuario = await usuariosRepo.findByEmail(email);
  if (!usuario || !usuario.ativo) return;

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');

  await withTransaction(async (client) => {
    await recuperacoesRepo.invalidarPendentes(usuario.id, client);
    await recuperacoesRepo.create(
      { usuarioId: usuario.id, tokenHash, expiraEm: new Date(Date.now() + RESET_TTL_MS) },
      client,
    );
  });
}
