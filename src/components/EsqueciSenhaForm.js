'use client';

/**
 * Formulário "Esqueci minha senha": envia o e-mail para receber o link de redefinição.
 */

import { useState } from 'react';
import styles from './AuthCard.module.css';

export default function EsqueciSenhaForm() {
  // Estado da tela: mensagem de erro, mensagem de sucesso e envio em andamento.
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Envia o e-mail para a API; a resposta é sempre a mesma, exista ou não a conta.
  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email') }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(body.fields?.email || body.error || 'Não foi possível enviar o pedido.');
        return;
      }
      setMensagem(body.message);
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  // Depois do envio, mostra só a confirmação.
  if (mensagem) {
    return <p className={styles.success}>{mensagem}</p>;
  }

  // Desenho da tela (JSX).
  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {erro && (
        <p className={styles.alert} role="alert">
          {erro}
        </p>
      )}
      <div className={styles.field}>
        <label htmlFor="email">E-mail cadastrado</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <button className={styles.button} type="submit" disabled={enviando}>
        {enviando ? 'Enviando...' : 'Enviar link de redefinição'}
      </button>
    </form>
  );
}
