'use client';

/**
 * Tela Meu perfil: mostra os dados da pessoa, permite atualizar o telefone de contato
 * e trocar a senha (com a senha atual). Ao trocar a senha, as outras sessões saem.
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { Check, KeyRound, Loader2, Phone, UserCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Campo, LegendaObrigatorio, faltando, useErros } from '@/components/condo/campo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { enviarJson, lerResposta } from '@/lib/apiClient';
import { formatTelefone } from '@/lib/masks';
import { avaliarSenha } from '@/lib/passwordRules';
import { cn } from '@/lib/utils';

// AAAA-MM-DD (ou data/hora ISO) -> DD/MM/AAAA
const dataBR = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '—');

const senhaVazia = { senhaAtual: '', novaSenha: '', confirmacao: '' };

/** Linha "rótulo: valor" dos dados pessoais. */
function Dado({ rotulo, valor }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="font-medium text-foreground">{valor || '—'}</span>
    </div>
  );
}

export default function PerfilTela() {
  const [perfil, setPerfil] = useState(null);
  const [erroCarga, setErroCarga] = useState(null);

  // Telefone
  const [tel, setTel] = useState({ telefone: '' });
  const [errosTel, setErrosTel] = useErros(tel);
  const [salvandoTel, setSalvandoTel] = useState(false);

  // Senha
  const [senha, setSenha] = useState(senhaVazia);
  const [errosSenha, setErrosSenha] = useErros(senha);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const criterios = avaliarSenha(senha.novaSenha);

  // Carrega os dados ao abrir a tela.
  useEffect(() => {
    fetch('/api/perfil', { cache: 'no-store' })
      .then(lerResposta)
      .then(({ perfil: p }) => {
        setPerfil(p);
        setTel({ telefone: p.telefone });
      })
      .catch((e) => setErroCarga(e.message));
  }, []);

  // Salva o telefone novo.
  const salvarTelefone = async () => {
    const vazios = faltando(tel, ['telefone']);
    setErrosTel(vazios);
    if (Object.keys(vazios).length) return;
    setSalvandoTel(true);
    try {
      const r = await enviarJson('/api/perfil', 'PATCH', tel);
      setPerfil((p) => ({ ...p, telefone: r.telefone }));
      toast.success('Telefone atualizado.');
    } catch (e) {
      setErrosTel(e.campos ?? {});
      toast.error(e.message);
    } finally {
      setSalvandoTel(false);
    }
  };

  // Troca a senha (as outras sessões saem; esta continua).
  const trocarSenha = async () => {
    const vazios = faltando(senha, ['senhaAtual', 'novaSenha', 'confirmacao']);
    setErrosSenha(vazios);
    if (Object.keys(vazios).length) {
      toast.error('Preencha os campos obrigatórios destacados.');
      return;
    }
    setSalvandoSenha(true);
    try {
      await enviarJson('/api/perfil/senha', 'POST', senha);
      setSenha(senhaVazia);
      toast.success('Senha alterada. Os outros dispositivos precisarão entrar de novo.');
    } catch (e) {
      setErrosSenha(e.campos ?? {});
      toast.error(e.message);
    } finally {
      setSalvandoSenha(false);
    }
  };

  // Desenho da tela (JSX).
  return (
    <AppLayout titulo="Meu perfil" subtitulo="Seus dados de acesso e de contato">
      {erroCarga && <p className="mb-4 text-sm text-destructive">{erroCarga}</p>}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserCircle2 className="h-5 w-5 text-primary" /> Meus dados
          </h2>
          {!perfil ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="mt-3">
              <Dado rotulo="Nome" valor={perfil.nome} />
              <Dado rotulo="E-mail" valor={perfil.email} />
              <Dado rotulo="CPF" valor={perfil.cpf} />
              <Dado rotulo="Data de nascimento" valor={dataBR(perfil.dataNascimento)} />
              <Dado rotulo="Perfil" valor={perfil.perfil} />
              <Dado rotulo="Condomínio" valor={perfil.condominio} />
              {perfil.unidade && <Dado rotulo="Unidade" valor={perfil.unidade} />}
              <Dado rotulo="Cadastro desde" valor={dataBR(perfil.membroDesde)} />
              <p className="mt-3 text-xs text-muted-foreground">
                Para corrigir nome, e-mail, CPF ou unidade, procure o síndico.
              </p>
            </div>
          )}

          {perfil?.demo ? (
            <p className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
              Conta de demonstração: o perfil fica só para leitura.
            </p>
          ) : (
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Phone className="h-4 w-4 text-primary" /> Telefone de contato
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                A portaria e o síndico usam este número para falar com você (ex.: sobre uma
                reserva).
              </p>
              <div className="mt-3 flex items-start gap-2">
                <Campo
                  id="perfil-telefone"
                  label="Telefone"
                  obrigatorio
                  erro={errosTel.telefone}
                  className="flex-1"
                >
                  <Input
                    id="perfil-telefone"
                    inputMode="numeric"
                    value={tel.telefone}
                    onChange={(e) => setTel({ telefone: formatTelefone(e.target.value) })}
                    placeholder="(61) 90000-0000"
                    className="h-11 rounded-xl"
                  />
                </Campo>
                <Button
                  className="mt-6 h-11 rounded-xl"
                  onClick={salvarTelefone}
                  disabled={salvandoTel || !perfil || tel.telefone === perfil.telefone}
                >
                  {salvandoTel && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
                </Button>
              </div>
            </div>
          )}
        </section>

        {!perfil?.demo && (
          <section className="h-fit rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <KeyRound className="h-5 w-5 text-primary" /> Trocar senha
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Depois da troca, os outros computadores e celulares conectados precisam entrar de
              novo.
            </p>
            <div className="mt-4 space-y-3">
              <LegendaObrigatorio />
              <Campo id="senha-atual" label="Senha atual" obrigatorio erro={errosSenha.senhaAtual}>
                <Input
                  id="senha-atual"
                  type="password"
                  autoComplete="current-password"
                  value={senha.senhaAtual}
                  onChange={(e) => setSenha({ ...senha, senhaAtual: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </Campo>
              <Campo id="senha-nova" label="Nova senha" obrigatorio erro={errosSenha.novaSenha}>
                <Input
                  id="senha-nova"
                  type="password"
                  autoComplete="new-password"
                  value={senha.novaSenha}
                  onChange={(e) => setSenha({ ...senha, novaSenha: e.target.value })}
                  className="h-11 rounded-xl"
                />
                <ul className="grid gap-0.5 pt-1 sm:grid-cols-2">
                  {criterios.map((c) => (
                    <li
                      key={c.id}
                      className={cn(
                        'flex items-center gap-1 text-xs',
                        c.ok ? 'text-success' : 'text-muted-foreground',
                      )}
                    >
                      {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {c.texto}
                    </li>
                  ))}
                </ul>
              </Campo>
              <Campo
                id="senha-confirmacao"
                label="Confirme a nova senha"
                obrigatorio
                erro={errosSenha.confirmacao}
              >
                <Input
                  id="senha-confirmacao"
                  type="password"
                  autoComplete="new-password"
                  value={senha.confirmacao}
                  onChange={(e) => setSenha({ ...senha, confirmacao: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </Campo>
              <Button
                className="mt-2 h-11 w-full rounded-xl"
                onClick={trocarSenha}
                disabled={salvandoSenha}
              >
                {salvandoSenha && <Loader2 className="h-4 w-4 animate-spin" />} Trocar senha
              </Button>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
