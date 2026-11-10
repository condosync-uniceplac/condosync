/**
 * Página /visitantes (Meus Visitantes, do morador).
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import VisitantesTela from '@/components/condo/VisitantesTela';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'Meus Visitantes — CondoSync',
  description: 'Pré-autorização de visitantes e confirmação de visitas não previstas.',
};

export default function VisitantesPage() {
  return <VisitantesTela />;
}
