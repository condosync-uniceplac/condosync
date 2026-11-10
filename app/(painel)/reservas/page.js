/**
 * Página /reservas (reservas de áreas comuns).
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import ReservasTela from '@/components/condo/ReservasTela';

// Título (e descrição) da aba do navegador.
export const metadata = {
  title: 'Reservas de Áreas Comuns — CondoSync',
  description:
    'Agende salão de festas, churrasqueira, quadra e academia com validação automática de horários.',
};

export default function ReservasPage() {
  return <ReservasTela />;
}
