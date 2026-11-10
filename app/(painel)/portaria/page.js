/**
 * Página /portaria (controle de visitantes pela portaria/síndico).
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import PortariaTela from '@/components/condo/PortariaTela';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'Portaria e Controle de Acesso — CondoSync',
  description: 'Visitantes pré-autorizados, visitas não previstas e registro de entrada e saída.',
};

export default function PortariaPage() {
  return <PortariaTela />;
}
