/**
 * Página /chamados (Chamados e Ocorrências).
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import ChamadosTela from '@/components/condo/ChamadosTela';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'Chamados e Ocorrências — CondoSync',
  description:
    'Abra ocorrências de barulho, vaga de garagem, manutenção e limpeza e acompanhe o andamento em quadro visual.',
};

export default function ChamadosPage() {
  return <ChamadosTela />;
}
