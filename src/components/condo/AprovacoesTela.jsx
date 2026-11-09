'use client';

import { Check, UserCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { SindicaturaCard } from '@/components/condo/SindicaturaCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PERFIL_LABEL = { MORADOR: 'Morador', PORTARIA: 'Portaria', SINDICO: 'Síndico' };

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { dateStyle: 'short' });
}

/** RF.03 (versão 2): o síndico aprova ou recusa os cadastros pendentes. */
export default function AprovacoesTela() {
  const [cadastros, setCadastros] = useState(null);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      const res = await fetch('/api/admin/cadastros', { cache: 'no-store' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível carregar os cadastros.');
      setCadastros(body.cadastros);
    } catch (e) {
      setErro(e.message);
      setCadastros([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function decidir(cadastro, acao) {
    if (acao === 'recusar' && !window.confirm(`Recusar o cadastro de ${cadastro.nome}?`)) return;
    setProcessando(cadastro.id);
    try {
      const res = await fetch(`/api/admin/cadastros/${cadastro.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível concluir a ação.');
      toast.success(
        acao === 'aprovar' ? `${cadastro.nome} agora tem acesso.` : 'Cadastro recusado.',
      );
      setCadastros((lista) => lista.filter((c) => c.id !== cadastro.id));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setProcessando(null);
    }
  }

  return (
    <AppLayout
      titulo="Administração"
      subtitulo="Síndico do condomínio e aprovação de novos cadastros"
    >
      <SindicaturaCard />
      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">Cadastros pendentes</h2>
          {cadastros && cadastros.length > 0 && (
            <Badge className="rounded-full">{cadastros.length}</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Novos usuários só acessam o CondoSync depois que o síndico aprova o cadastro.
        </p>

        {erro && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {erro}
          </p>
        )}

        {cadastros === null && (
          <p className="mt-4 text-sm text-muted-foreground">Carregando cadastros...</p>
        )}

        {cadastros?.length === 0 && !erro && (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum cadastro aguardando aprovação.
          </p>
        )}

        {cadastros?.length > 0 && (
          <ul className="mt-4 divide-y divide-border">
            {cadastros.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{c.nome}</span>
                    <Badge variant="outline" className="rounded-full">
                      {PERFIL_LABEL[c.perfil] ?? c.perfil}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {c.email}
                    {c.unidade ? ` · ${c.unidade}` : ''} · cadastrado em {formatarData(c.criadoEm)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => decidir(c, 'aprovar')}
                    disabled={processando === c.id}
                  >
                    <Check className="h-4 w-4" /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decidir(c, 'recusar')}
                    disabled={processando === c.id}
                  >
                    <X className="h-4 w-4" /> Recusar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppLayout>
  );
}
