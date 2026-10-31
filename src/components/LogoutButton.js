'use client';

import { useRouter } from 'next/navigation';
import styles from './Painel.module.css';

export default function LogoutButton() {
  const router = useRouter();

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
