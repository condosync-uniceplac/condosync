/**
 * Layout de todas as páginas do painel (pasta (painel), que não aparece no endereço).
 * Roda no servidor: confere a sessão, busca o nome/unidade do usuário e os dados do condomínio
 * e entrega tudo ao CondoShell, que envolve as telas.
 */

import { redirect } from 'next/navigation';
import { getSession, getValidSession } from '@/lib/session';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as usuariosRepo from '@/repositories/usuariosRepository';
import CondoShell from '@/components/condo/CondoShell';

// Nome do perfil exibido no topo da tela.
const PERFIL_LABEL = {
  MORADOR: 'Morador',
  PORTARIA: 'Portaria',
  SINDICO: 'Síndico',
  ADMIN: 'Administrador',
};

// As telas do painel têm visões por perfil; o Administrador só vê a Administração.
// Perfil no formato usado pelas telas (minúsculo).
const PERFIL_TELA = {
  MORADOR: 'morador',
  PORTARIA: 'portaria',
  SINDICO: 'sindico',
  ADMIN: 'admin',
};

// Iniciais do nome para o avatar (ex.: Maria Moradora -> MM).
function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export default async function PainelLayout({ children }) {
  // Sem cookie de sessão: vai para o login.
  const token = await getSession();
  if (!token) redirect('/login');
  // Perfil, unidade ou acesso alterados desde o login: encerra a sessão antiga
  const session = await getValidSession();
  if (!session) redirect('/api/auth/sessao-expirada');

  // "Cargo" exibido no topo: unidade para morador; nome do perfil para os demais.
  // Texto abaixo do nome: unidade para o morador; perfil (e unidade, se tiver) para os demais.
  let cargo = PERFIL_LABEL[session.perfil];
  let email = '';
  let condominio = null;
  try {
    condominio = await condominiosRepo.findResumo(session.condominioId);
    if (session.unidadeId) {
      const unidade = await condominiosRepo.findUnidade(session.unidadeId);
      const apto = unidade ? `Apto ${unidade.numero} - ${unidade.bloco}` : null;
      if (apto) cargo = session.perfil === 'MORADOR' ? apto : `${cargo} · ${apto}`;
    }
    const usuario = await usuariosRepo.findPublicById(session.sub);
    email = usuario?.email ?? '';
  } catch (err) {
    console.error('painel/layout: não foi possível carregar dados do usuário', err);
  }

  const perfil = PERFIL_TELA[session.perfil];
  return (
    <CondoShell
      sessao={{ email, perfil }}
      usuario={{ nome: session.nome, cargo, email, iniciais: iniciais(session.nome) }}
      condominio={condominio}
    >
      {children}
    </CondoShell>
  );
}
