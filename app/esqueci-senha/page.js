/**
 * Página pública /esqueci-senha (pedido do link de recuperação).
 */

import Link from 'next/link';
import EsqueciSenhaForm from '@/components/EsqueciSenhaForm';
import styles from '@/components/AuthCard.module.css';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Esqueci a senha | CondoSync' };

export default function EsqueciSenhaPage() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <h1 className={styles.brand}>CondoSync</h1>
        <p className={styles.subtitle}>Informe seu e-mail para receber o link de redefinição</p>
        <EsqueciSenhaForm />
        <p className={styles.footer}>
          Lembrou a senha? <Link href="/login">Voltar ao login</Link>
        </p>
      </section>
    </main>
  );
}
