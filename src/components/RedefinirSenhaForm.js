'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PasswordChecklist from './PasswordChecklist';
import styles from './AuthCard.module.css';

export default function RedefinirSenhaForm() {
  const token = useSearchParams().get('token') ?? '';
  const [erro, setErro] = useState('');
  const [concluido, setConcluido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [confirmacaoDigitada, setConfirmacaoDigitada] = useState('');
  const senhasDiferentes = confirmacaoDigitada.length > 0 && confirmacaoDigitada !== senhaDigitada;
  // null = verificando; true/false = resultado da verificação do link
  const [linkValido, setLinkValido] = useState(token ? null : false);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    fetch('/api/auth/reset-password/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => ativo && setLinkValido(Boolean(d.valido)))
      // Falha de rede: mostra o formulário; o envio valida o link de qualquer forma
      .catch(() => ativo && setLinkValido(true));
    return () => {
      ativo = false;
    };
  }, [token]);

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

  if (linkValido === null) {
    return <p className={styles.subtitle}>Verificando o link...</p>;
  }

  if (!linkValido) {
    return (
      <div className={styles.form}>
        <p className={styles.alert} role="alert">
          Este link de redefinição é inválido ou expirou. Cada link vale por 1 hora e só pode ser
          usado uma vez.
        </p>
        <Link className={styles.button} href="/esqueci-senha" style={{ textAlign: 'center' }}>
          Solicitar um novo link
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
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          value={senhaDigitada}
          onChange={(e) => setSenhaDigitada(e.target.value)}
          aria-describedby="senha-criterios"
          required
        />
        <PasswordChecklist senha={senhaDigitada} id="senha-criterios" />
      </div>
      <div className={styles.field}>
        <label htmlFor="confirmacao">Confirme a nova senha</label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          value={confirmacaoDigitada}
          onChange={(e) => setConfirmacaoDigitada(e.target.value)}
          required
        />
        {senhasDiferentes && <span className={styles.fieldError}>As senhas não conferem.</span>}
      </div>
      <button className={styles.button} type="submit" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Redefinir senha'}
      </button>
    </form>
  );
}
