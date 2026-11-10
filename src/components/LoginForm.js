'use client';

/**
 * Formulário de login (e-mail ou CPF + senha).
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './AuthCard.module.css';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Mensagem de erro e envio em andamento.
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Envia as credenciais; se der certo, vai para a página pedida (?next) ou para o painel.
  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificador: form.get('identificador'),
          senha: form.get('senha'),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErro(body.error || 'Não foi possível entrar.');
        return;
      }
      // Só aceita redirecionamento interno (evita open redirect)
      const next = searchParams.get('next');
      router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/painel');
      router.refresh();
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  const sessaoExpirada = searchParams.get('sessao') === 'expirada';

  // Desenho da tela (JSX).
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {sessaoExpirada && !erro && (
        <p className={styles.alert} role="status">
          Seu perfil de acesso foi alterado. Entre novamente para continuar.
        </p>
      )}
      {erro && (
        <p className={styles.alert} role="alert">
          {erro}
        </p>
      )}
      <div className={styles.field}>
        <label htmlFor="identificador">E-mail ou CPF</label>
        <input
          id="identificador"
          name="identificador"
          placeholder="seu@email.com ou 000.000.000-00"
          maxLength={254}
          autoComplete="username"
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required />
        <Link href="/esqueci-senha" style={{ fontSize: '0.875rem', alignSelf: 'flex-end' }}>
          Esqueceu a senha?
        </Link>
      </div>
      <button className={styles.button} type="submit" disabled={enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
