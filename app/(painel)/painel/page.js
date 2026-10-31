import PainelTela from '@/components/condo/PainelTela';
import AcessoNegadoAviso from '@/components/condo/AcessoNegadoAviso';

export const metadata = {
  title: 'Visão Geral — CondoSync',
  description:
    'Painel com reservas agendadas, visitantes esperados, avisos não lidos e ocorrências abertas do condomínio.',
};

export default async function PainelPage({ searchParams }) {
  const { erro } = await searchParams;
  return (
    <>
      {erro === 'acesso-negado' && <AcessoNegadoAviso />}
      <PainelTela />
    </>
  );
}
