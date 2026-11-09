import { redirect } from 'next/navigation';
import { getSession, getValidSession } from '@/lib/session';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as usuariosRepo from '@/repositories/usuariosRepository';
import CondoShell from '@/components/condo/CondoShell';

const PERFIL_LABEL = {
  MORADOR: 'Morador',
  PORTARIA: 'Portaria',
  SINDICO: 'Síndico',
  ADMIN: 'Administrador',
};

// As telas do painel têm visões por perfil; o Administrador só vê a Administração.
const PERFIL_TELA = {
  MORADOR: 'morador',
  PORTARIA: 'portaria',
  SINDICO: 'sindico',
  ADMIN: 'admin',
};

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export default async function PainelLayout({ children }) {
  const token = await getSession();
  if (!token) redirect('/login');
  // Perfil, unidade ou acesso alterados desde o login: encerra a sessão antiga
  const session = await getValidSession();
  if (!session) redirect('/api/auth/sessao-expirada');

  // "Cargo" exibido no topo: unidade para morador; nome do perfil para os demais.
  let cargo = PERFIL_LABEL[session.perfil];
  let email = '';
  try {
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
    >
      {children}
    </CondoShell>
  );
}
