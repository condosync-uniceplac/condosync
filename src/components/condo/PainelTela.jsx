'use client';

import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  DoorOpen,
  Megaphone,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatarData, useCondo } from '@/lib/condo-store';
import { cn } from '@/lib/utils';
const CORES_PRIORIDADE = {
  Urgente: 'bg-destructive/10 text-destructive',
  Manutenção: 'bg-warning/15 text-warning-foreground',
  Social: 'bg-accent text-accent-foreground',
};
export default function Painel() {
  const { estado, usuario, marcarLido } = useCondo();
  const router = useRouter();
  const proxima = [...estado.reservas].sort((a, b) => a.data.localeCompare(b.data))[0];
  const esperados = estado.visitantes.filter((v) => v.status === 'aguardando').length;
  const naoLidos = estado.avisos.filter((a) => !a.lido).length;
  const abertos = estado.chamados.filter((c) => c.status !== 'resolvido').length;
  const indicadores = [
    {
      titulo: 'Próxima Reserva Agendada',
      valor: proxima ? formatarData(proxima.data) : 'Nenhuma',
      detalhe: proxima ? `${proxima.espaco} · ${proxima.turno}` : 'Nenhuma reserva ativa',
      icone: CalendarDays,
      cor: 'text-primary bg-accent',
    },
    {
      titulo: 'Visitantes Esperados Hoje',
      valor: String(esperados),
      detalhe: 'Aguardando liberação na portaria',
      icone: Users,
      cor: 'text-primary bg-accent',
    },
    {
      titulo: 'Avisos Não Lidos',
      valor: String(naoLidos),
      detalhe: 'Comunicados da administração',
      icone: Megaphone,
      cor: 'text-destructive bg-destructive/10',
    },
    {
      titulo: 'Ocorrências Abertas',
      valor: String(abertos),
      detalhe: 'Chamados em andamento',
      icone: AlertTriangle,
      cor: 'text-warning-foreground bg-warning/15',
    },
  ];
  return (
    <AppLayout
      titulo={`Olá, ${usuario?.nome.split(' ')[0]} 👋`}
      subtitulo={`Visão geral do Residencial Vila Aurora · ${usuario?.cargo}`}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((i) => (
          <div
            key={i.titulo}
            className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{i.titulo}</p>
              <span className={cn('rounded-lg p-2', i.cor)}>
                <i.icone className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-foreground">{i.valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{i.detalhe}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button className="rounded-xl" onClick={() => router.push('/reservas')}>
          <CalendarPlus className="h-4 w-4" /> Nova Reserva
        </Button>
        <Button className="rounded-xl" onClick={() => router.push('/portaria')}>
          <DoorOpen className="h-4 w-4" /> Liberar Visitante
        </Button>
        <Button className="rounded-xl" onClick={() => router.push('/chamados')}>
          <ClipboardList className="h-4 w-4" /> Registrar Ocorrência
        </Button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Comunicados Oficiais</h2>
            <button
              onClick={() => router.push('/avisos')}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Ver mural completo
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {estado.avisos.slice(0, 4).map((a) => (
              <article
                key={a.id}
                className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn('rounded-full border-0', CORES_PRIORIDADE[a.prioridade])}>
                    {a.prioridade}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatarData(a.data)} · {a.autor}
                  </span>
                  {!a.lido && (
                    <button
                      onClick={() => {
                        marcarLido(a.id);
                        toast.success('Comunicado marcado como lido');
                      }}
                      className="ml-auto text-xs font-semibold text-primary hover:underline"
                    >
                      Marcar como lido
                    </button>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground">{a.titulo}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-base font-bold text-foreground">Agenda dos espaços</h2>
            <div className="mt-4 space-y-3">
              {[...estado.reservas]
                .sort((a, b) => a.data.localeCompare(b.data))
                .slice(0, 4)
                .map((r) => (
                  <div key={r.id} className="flex items-start gap-3">
                    <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                      {formatarData(r.data).slice(0, 5)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{r.espaco}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.turno} · {r.unidade}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-base font-bold text-foreground">Movimento da portaria</h2>
            <div className="mt-4 space-y-3">
              {estado.visitantes.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{v.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.unidade} · previsão {v.previsao}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      'shrink-0 rounded-full border-0 text-[10px]',
                      v.status === 'aguardando' && 'bg-warning/15 text-warning-foreground',
                      v.status === 'no-condominio' && 'bg-success/15 text-success',
                      v.status === 'concluido' && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {v.status === 'aguardando'
                      ? 'Aguardando'
                      : v.status === 'no-condominio'
                        ? 'No condomínio'
                        : 'Concluído'}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
