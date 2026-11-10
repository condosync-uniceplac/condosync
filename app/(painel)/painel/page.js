/**
 * Página /painel (Visão Geral). Mostra o aviso de "acesso negado" quando o middleware redireciona para cá.
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import { redirect } from 'next/navigation';
import PainelTela from '@/components/condo/PainelTela';
import { getSession } from '@/lib/session';
import AcessoNegadoAviso from '@/components/condo/AcessoNegadoAviso';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'Visão Geral — CondoSync',
  description:
    'Painel com reservas agendadas, visitantes esperados, avisos não lidos e ocorrências abertas do condomínio.',
};

export default async function PainelPage({ searchParams }) {
  // O Administrador não usa o painel do condomínio: vai direto para a Administração
  if ((await getSession())?.perfil === 'ADMIN') redirect('/admin');
  const { erro } = await searchParams;
  return (
    <>
      {erro === 'acesso-negado' && <AcessoNegadoAviso />}
      <PainelTela />
    </>
  );
}
