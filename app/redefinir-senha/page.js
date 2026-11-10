/**
 * Página pública /redefinir-senha (nova senha a partir do link recebido por e-mail).
 */

import { Suspense } from 'react';
import RedefinirSenhaForm from '@/components/RedefinirSenhaForm';
import styles from '@/components/AuthCard.module.css';

// Título (e descrição) da aba do navegador.
export const metadata = { title: 'Redefinir senha | CondoSync' };

export default function RedefinirSenhaPage() {
  return (
    <main className={styles.wrapper}>
      <section className={styles.card}>
        <h1 className={styles.brand}>CondoSync</h1>
        <p className={styles.subtitle}>Crie uma nova senha</p>
        {/* Suspense: o formulário lê parâmetros da URL, o que o Next exige dentro de Suspense. */}
        <Suspense>
          <RedefinirSenhaForm />
        </Suspense>
      </section>
    </main>
  );
}
