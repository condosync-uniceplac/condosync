import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import * as condominiosRepo from '@/repositories/condominiosRepository';
import * as usuariosRepo from '@/repositories/usuariosRepository';
import CondoShell from '@/components/condo/CondoShell';

const PERFIL_LABEL = {
  MORADOR: 'Morador',
  PORTARIA: 'Portaria',
  SINDICO: 'Síndico',
  ADMIN: 'Administrador',
};

// As telas do painel têm visões por perfil; Administrador usa a visão do Síndico.
const PERFIL_TELA = {
  MORADOR: 'morador',
  PORTARIA: 'portaria',
  SINDICO: 'sindico',
  ADMIN: 'sindico',
};

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export default async function PainelLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  // "Cargo" exibido no topo: unidade para morador; nome do perfil para os demais.
  let cargo = PERFIL_LABEL[session.perfil];
  let email = '';
  try {
    if (session.perfil === 'MORADOR' && session.unidadeId) {
      const unidade = await condominiosRepo.findUnidade(session.unidadeId);
      if (unidade) cargo = `Apto ${unidade.numero} - ${unidade.bloco}`;
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
