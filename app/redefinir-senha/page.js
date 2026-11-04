import { Suspense } from 'react';
import RedefinirSenhaForm from '@/components/RedefinirSenhaForm';
import styles from '@/components/AuthCard.module.css';

export const metadata = { title: 'Redefinir senha | CondoSync' };

export default function RedefinirSenhaPage() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <h1 className={styles.brand}>CondoSync</h1>
        <p className={styles.subtitle}>Crie uma nova senha</p>
        <Suspense>
          <RedefinirSenhaForm />
        </Suspense>
      </section>
    </main>
  );
}
