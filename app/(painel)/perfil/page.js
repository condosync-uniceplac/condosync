/**
 * Página /perfil (Meu perfil): dados da pessoa, telefone de contato e troca de senha.
 * No Next.js, o arquivo page.js dentro de uma pasta vira a página com aquele endereço;
 * os dados são buscados pelo componente da tela, chamando a API.
 */

import PerfilTela from '@/components/condo/PerfilTela';

export const metadata = { title: 'Meu perfil — CondoSync' };

export default function PerfilPage() {
  return <PerfilTela />;
}
