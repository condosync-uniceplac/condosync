'use client';

/**
 * Botão "Sair": encerra a sessão e volta para o login.
 */

import { useRouter } from 'next/navigation';
import styles from './Painel.module.css';

export default function LogoutButton() {
  const router = useRouter();

  // Pede à API para apagar o cookie de sessão e redireciona.
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <button type="button" className={styles.logout} onClick={handleLogout}>
      Sair
    </button>
  );
}
