/**
 * Página /avisos (Mural de Avisos).
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import AvisosTela from '@/components/condo/AvisosTela';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'Mural de Avisos — CondoSync',
  description:
    'Comunicados oficiais da administração com filtros por obras, assembleias, normas e financeiro.',
};

export default function AvisosPage() {
  return <AvisosTela />;
}
