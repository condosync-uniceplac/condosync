'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PasswordChecklist from './PasswordChecklist';
import styles from './AuthCard.module.css';
import { formatCpf, formatTelefone } from '@/lib/masks';

const PERFIS = [
  { value: 'MORADOR', label: 'Morador' },
  { value: 'PORTARIA', label: 'Portaria' },
];

function Field({ id, label, error, hint, children }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <span className={styles.fieldError}>{error}</span>
      ) : (
        hint && (
          <span className={styles.hint} id={`${id}-dica`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

export default function RegisterForm() {
  const [condominios, setCondominios] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [condominioId, setCondominioId] = useState('');
  const [perfil, setPerfil] = useState('MORADOR');
  const [erro, setErro] = useState('');
  const [campos, setCampos] = useState({});
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const senhasDiferentes = confirmacao.length > 0 && confirmacao !== senha;

  useEffect(() => {
    fetch('/api/condominios')
      .then((r) => r.json())
      .then((d) => setCondominios(d.condominios ?? []))
      .catch(() => setErro('Não foi possível carregar os condomínios.'));
  }, []);

  useEffect(() => {
    if (!condominioId) return;
    fetch(`/api/condominios/${condominioId}/unidades`)
      .then((r) => r.json())
      .then((d) => setUnidades(d.unidades ?? []))
      .catch(() => setUnidades([]));
  }, [condominioId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');
    setCampos({});
    if (senha !== confirmacao) {
      setCampos({ confirmacao: 'As senhas não conferem.' });
      return;
    }
    setEnviando(true);
    const f = new FormData(event.currentTarget);
    const payload = {
      nome: f.get('nome'),
      email: f.get('email'),
      telefone: f.get('telefone'),
      cpf: f.get('cpf'),
      dataNascimento: f.get('dataNascimento'),
      senha: f.get('senha'),
      perfil,
      condominioId: condominioId || undefined,
      unidadeId: f.get('unidadeId') || undefined,
      aceiteTermos: f.get('aceiteTermos') === 'on',
      aceitePrivacidade: f.get('aceitePrivacidade') === 'on',
    };
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(body.error || 'Não foi possível concluir o cadastro.');
        setCampos(body.fields || {});
        return;
      }
      setSucesso(body.usuario);
    } catch {
      setErro('Falha de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (sucesso) {
    return (
      <div className={styles.form}>
        <p className={styles.success}>
          Cadastro concluído! Seu acesso será liberado após a aprovação do síndico.
        </p>
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

      <Field id="nome" label="Nome completo" error={campos.nome}>
        <input id="nome" name="nome" autoComplete="name" required />
      </Field>

      <div className={styles.grid}>
        <Field id="email" label="E-mail" error={campos.email}>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field
          id="telefone"
          label="Telefone"
          error={campos.telefone}
          hint="Com DDD. Ex.: (61) 99999-0000"
        >
          <input
            id="telefone"
            name="telefone"
            type="tel"
            inputMode="numeric"
            placeholder="(61) 99999-0000"
            autoComplete="tel"
            value={telefone}
            onChange={(e) => setTelefone(formatTelefone(e.target.value))}
            aria-describedby="telefone-dica"
            required
          />
        </Field>
        <Field
          id="cpf"
          label="CPF"
          error={campos.cpf}
          hint="Digite só os números. Ex.: 000.000.000-00"
        >
          <input
            id="cpf"
            name="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            aria-describedby="cpf-dica"
            required
          />
        </Field>
        <Field id="dataNascimento" label="Data de nascimento" error={campos.dataNascimento}>
          <input id="dataNascimento" name="dataNascimento" type="date" required />
        </Field>
        <div className={styles.field}>
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby="senha-criterios"
            required
          />
          {campos.senha && <span className={styles.fieldError}>{campos.senha}</span>}
          <PasswordChecklist senha={senha} id="senha-criterios" />
        </div>
        <Field
          id="confirmacao"
          label="Confirme a senha"
          error={campos.confirmacao || (senhasDiferentes ? 'As senhas não conferem.' : '')}
        >
          <input
            id="confirmacao"
            name="confirmacao"
            type="password"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className={styles.grid}>
        <Field id="perfil" label="Perfil" error={campos.perfil}>
          <select id="perfil" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
            {PERFIS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="condominioId" label="Condomínio" error={campos.condominioId}>
          <select
            id="condominioId"
            value={condominioId}
            onChange={(e) => setCondominioId(e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {condominios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
        {perfil === 'MORADOR' && (
          <Field id="unidadeId" label="Unidade" error={campos.unidadeId}>
            <select id="unidadeId" name="unidadeId" disabled={!condominioId} required>
              <option value="">Selecione...</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  Bloco {u.bloco} - {u.numero}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <label className={styles.checkbox}>
        <input type="checkbox" name="aceiteTermos" required />
        <span>
          Li e aceito os <a href="#">Termos de Uso</a>.
          {campos.aceiteTermos && <span className={styles.fieldError}> {campos.aceiteTermos}</span>}
        </span>
      </label>
      <label className={styles.checkbox}>
        <input type="checkbox" name="aceitePrivacidade" required />
        <span>
          Li e aceito a <a href="#">Política de Privacidade</a>.
          {campos.aceitePrivacidade && (
            <span className={styles.fieldError}> {campos.aceitePrivacidade}</span>
          )}
        </span>
      </label>

      <button className={styles.button} type="submit" disabled={enviando}>
        {enviando ? 'Enviando...' : 'Criar conta'}
      </button>
    </form>
  );
}
