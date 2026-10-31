'use client';

import { CheckCircle2, Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatarData, useCondo } from '@/lib/condo-store';
import { cn } from '@/lib/utils';
const CATEGORIAS = ['Todos', 'Obras', 'Assembleias', 'Normas', 'Financeiro'];
const CORES = {
  Urgente: 'bg-destructive/10 text-destructive',
  Manutenção: 'bg-warning/15 text-warning-foreground',
  Social: 'bg-accent text-accent-foreground',
};
export default function Avisos() {
  const { estado, marcarLido } = useCondo();
  const [filtro, setFiltro] = useState('Todos');
  const lista = estado.avisos.filter((a) => filtro === 'Todos' || a.categoria === filtro);
  return (
    <AppLayout
      titulo="Mural de Avisos"
      subtitulo="Comunicados publicados pela administração do condomínio"
    >
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
              filtro === c
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {lista.map((a) => (
          <article
            key={a.id}
            className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn('rounded-full border-0', CORES[a.prioridade])}>
                {a.prioridade}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {a.categoria}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatarData(a.data)} · {a.autor}
              </span>
            </div>
            <h2 className="mt-3 text-base font-bold text-foreground">{a.titulo}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{a.texto}</p>

            {a.anexo && (
              <button
                onClick={() => toast.success(`Download iniciado: ${a.anexo}`)}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 sm:w-auto"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{a.anexo}</span>
                  <span className="block text-xs text-muted-foreground">
                    Documento oficial · PDF
                  </span>
                </span>
                <Download className="ml-6 h-4 w-4 text-muted-foreground" />
              </button>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Lido por {a.leituras} moradores</span>
              {a.lido ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" /> Leitura confirmada
                </span>
              ) : (
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    marcarLido(a.id);
                    toast.success('Leitura confirmada');
                  }}
                >
                  Confirmar leitura
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}
