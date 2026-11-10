'use client';

import { Loader2, Mail, ShieldCheck, UserMinus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { enviarJson, lerResposta } from '@/lib/apiClient';
import { formatCpf, formatTelefone } from '@/lib/masks';

const vazio = { nome: '', email: '', cpf: '', telefone: '', dataNascimento: '' };

/** RN.06 (revisada): o síndico cria as contas da portaria; o porteiro define a senha pelo convite. */
export function PortariaAba() {
  const [contas, setContas] = useState(null);
  const [form, setForm] = useState(vazio);
  const [enviando, setEnviando] = useState(false);
  const [linkManual, setLinkManual] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const d = await lerResposta(await fetch('/api/admin/portaria', { cache: 'no-store' }));
      setContas(d.contas);
    } catch (e) {
      toast.error(e.message);
      setContas([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const set = (k, fmt) => (e) =>
    setForm({ ...form, [k]: fmt ? fmt(e.target.value) : e.target.value });

  const criar = async () => {
    setEnviando(true);
    try {
      const { conta } = await enviarJson('/api/admin/portaria', 'POST', form);
      if (conta.conviteEnviado) {
        toast.success(`Conta criada. ${conta.nome} recebeu o convite em ${conta.email}.`);
      } else {
        setLinkManual({ nome: conta.nome, link: conta.linkConvite });
      }
      setForm(vazio);
      await carregar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const desativar = async (c) => {
    if (!window.confirm(`Desativar a conta de ${c.nome}? Ele perde o acesso à portaria.`)) return;
    try {
      await lerResposta(await fetch(`/api/admin/portaria/${c.vinculoId}`, { method: 'DELETE' }));
      toast.success(`Conta de ${c.nome} desativada.`);
      await carregar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      {linkManual && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 xl:col-span-2">
          <p className="text-sm font-semibold text-foreground">
            Conta de {linkManual.nome} criada, mas o e-mail de convite não pôde ser enviado.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Repasse este link ao porteiro para ele definir a senha (válido por 48 horas):
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input readOnly value={linkManual.link} className="h-9 flex-1 rounded-lg text-xs" />
            <Button
              size="sm"
              className="rounded-lg"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(linkManual.link)
                  .then(() => toast.success('Link copiado.'))
              }
            >
              Copiar link
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => setLinkManual(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
      <section className="h-fit rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <ShieldCheck className="h-4.5 w-4.5 text-primary" /> Nova conta da portaria
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          O porteiro recebe um e-mail para definir a senha (link válido por 48 horas).
        </p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-nome">Nome completo</Label>
            <Input
              id="p-nome"
              value={form.nome}
              onChange={set('nome')}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">E-mail</Label>
            <Input
              id="p-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-cpf">CPF</Label>
              <Input
                id="p-cpf"
                inputMode="numeric"
                value={form.cpf}
                onChange={set('cpf', formatCpf)}
                placeholder="000.000.000-00"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-telefone">Telefone</Label>
              <Input
                id="p-telefone"
                inputMode="numeric"
                value={form.telefone}
                onChange={set('telefone', formatTelefone)}
                placeholder="(61) 90000-0000"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-nasc">Data de nascimento</Label>
            <Input
              id="p-nasc"
              type="date"
              value={form.dataNascimento}
              onChange={set('dataNascimento')}
              className="h-11 rounded-xl"
            />
          </div>
          <Button className="mt-2 h-11 w-full rounded-xl" onClick={criar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{' '}
            Criar conta e enviar convite
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-base font-bold text-foreground">Contas ativas da portaria</h2>
        <ul className="mt-4 divide-y divide-border">
          {contas?.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma conta da portaria.
            </li>
          )}
          {contas?.map((c) => (
            <li
              key={c.vinculoId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {c.email} · {formatTelefone(c.telefone)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => desativar(c)}
              >
                <UserMinus className="h-3.5 w-3.5" /> Desativar
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
