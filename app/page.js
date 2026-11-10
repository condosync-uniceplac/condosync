/**
 * Página inicial (/): manda para o painel.
 */

import { redirect } from 'next/navigation';

// O middleware manda para /login quando não há sessão
export default function Home() {
  redirect('/painel');
}
