/**
 * Página pública /cadastro (formulário de cadastro de morador).
 */

import Link from 'next/link';
import RegisterForm from '@/components/RegisterForm';
import styles from '@/components/AuthCard.module.css';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Cadastro | CondoSync' };

export default function CadastroPage() {
  return (
    <main className={styles.wrapper}>
      <section className={`${styles.card} ${styles.wide}`}>
        <h1 className={styles.brand}>CondoSync</h1>
        <p className={styles.subtitle}>Crie sua conta</p>
        <RegisterForm />
        <p className={styles.footer}>
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
      </section>
    </main>
  );
}
