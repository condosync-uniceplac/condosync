'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './AuthCard.module.css';

export default function RedefinirSenhaForm() {
  const token = useSearchParams().get('token') ?? '';
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    const form = new FormData(event.currentTarget);
    const senha = form.get('senha');
    if (senha !== form.get('confirmacao')) {
      setErro('As senhas não conferem.');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(body.fields?.senha || body.error || 'Não foi possível redefinir a senha.');
        return;
      }
      setConcluido(true);
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <p className={styles.alert} role="alert">
        Link inválido. <Link href="/esqueci-senha">Solicite um novo</Link>.
      </p>
    );
  }

  if (concluido) {
    return (
      <div className={styles.form}>
        <p className={styles.success}>Senha redefinida! Você já pode entrar com a nova senha.</p>
        <Link className={styles.button} href="/login" style={{ textAlign: 'center' }}>
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {erro && (
        <p className={styles.alert} role="alert">
          {erro}
        </p>
      )}
      <div className={styles.field}>
        <label htmlFor="senha">Nova senha</label>
        <input id="senha" name="senha" type="password" autoComplete="new-password" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="confirmacao">Confirme a nova senha</label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <p className={styles.subtitle}>
        Mínimo de 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.
      </p>
      <button className={styles.button} type="submit" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Redefinir senha'}
      </button>
    </form>
  );
}
