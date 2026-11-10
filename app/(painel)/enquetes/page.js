/**
 * Página /enquetes (Enquetes e Votações).
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import EnquetesTela from '@/components/condo/EnquetesTela';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'Enquetes e Votações — CondoSync',
  description:
    'Participe das votações comunitárias do condomínio e acompanhe os resultados em tempo real.',
};

export default function EnquetesPage() {
  return <EnquetesTela />;
}
