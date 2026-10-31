import { Suspense } from 'react';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import styles from '@/components/AuthCard.module.css';

export const metadata = { title: 'Entrar | CondoSync' };

export default function LoginPage() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <h1 className={styles.brand}>CondoSync</h1>
        <p className={styles.subtitle}>Acesse sua conta</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className={styles.footer}>
          Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link>
        </p>
      </section>
    </main>
  );
}
