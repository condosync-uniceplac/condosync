/**
 * Página /admin (Administração): cadastros, moradores, portaria e espaços.
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import AprovacoesTela from '@/components/condo/AprovacoesTela';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Administração | CondoSync' };

// Acesso: SINDICO, ADMIN (middleware + src/middleware/rbac.js; a API revalida o perfil)
export default function AdminPage() {
  return <AprovacoesTela />;
}
