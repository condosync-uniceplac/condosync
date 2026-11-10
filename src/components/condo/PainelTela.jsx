'use client';

/**
 * Tela Visão Geral: indicadores por perfil, atalhos, comunicados, votações abertas,
 * agenda dos espaços e movimento da portaria.
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  DoorOpen,
  Megaphone,
  Users,
  Vote,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCondo } from '@/lib/condo-store';
import { dataLocal, turnoDaReserva } from '@/lib/turnos';
import { useAvisos } from '@/lib/useAvisos';
import { useChamadosAbertos } from '@/lib/useChamados';
import { useEnquetes } from '@/lib/useEnquetes';
import { useReservas } from '@/lib/useReservas';
import { useVisitas } from '@/lib/useVisitas';
import { VisitaStatus, formatarDataHora } from '@/components/condo/VisitaStatus';
import { cn } from '@/lib/utils';
// AAAA-MM-DD -> DD/MM/AAAA.
const formatarData = (iso) => {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};

export default function Painel() {
  // Dados vindos da API pelos hooks de cada módulo.
  const { estado, usuario, condominio } = useCondo();
  const { avisos, confirmarLeitura } = useAvisos();
  const router = useRouter();
  const { reservas, podeReservar } = useReservas();
  const minhas = podeReservar ? reservas.filter((r) => r.minha) : reservas;
  const proxima = minhas[0];
  const { visitas } = useVisitas();
  const { enquetes, podeVotar } = useEnquetes();
  const enquetesAbertas = enquetes.filter((e) => !e.encerrada);
  const hoje = dataLocal(new Date());
  const reservasHoje = reservas.filter((r) => dataLocal(r.inicio) === hoje).length;
  const aguardandoMorador = visitas.filter((v) => v.status === 'AGUARDANDO').length;
  const esperados = visitas.filter(
    (v) => ['AGUARDANDO', 'AUTORIZADO'].includes(v.status) && dataLocal(v.previsao) === hoje,
  ).length;
  const ehMorador = estado.sessao?.perfil === 'morador';
  const naoLidos = avisos.filter((a) => !a.lido).length;
  const abertos = useChamadosAbertos();
  const perfil = estado.sessao?.perfil;
  // Os 4 cartões do topo; o primeiro muda conforme o perfil.
  const indicadores = [
    podeReservar
      ? {
          titulo: 'Próxima Reserva Agendada',
          valor: proxima ? formatarData(dataLocal(proxima.inicio)) : 'Nenhuma',
          detalhe: proxima
            ? `${proxima.espaco} · ${turnoDaReserva(proxima.inicio, proxima.fim)?.rotulo ?? ''}`
            : 'Nenhuma reserva ativa da sua unidade',
          icone: CalendarDays,
          cor: 'text-primary bg-accent',
        }
      : {
          titulo: 'Reservas de Hoje',
          valor: String(reservasHoje),
          detalhe: proxima
            ? `Próxima: ${proxima.espaco} em ${formatarData(dataLocal(proxima.inicio))}`
            : 'Nenhuma reserva agendada',
          icone: CalendarDays,
          cor: 'text-primary bg-accent',
        },
    {
      titulo: 'Visitantes Esperados Hoje',
      valor: String(esperados),
      detalhe: aguardandoMorador
        ? ehMorador
          ? `${aguardandoMorador} aguardando sua confirmação`
          : `${aguardandoMorador} aguardando confirmação do morador`
        : ehMorador
          ? 'Da sua unidade'
          : 'No condomínio',
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
      valor: abertos === null ? '…' : String(abertos),
      detalhe: ehMorador ? 'Seus chamados em andamento' : 'Chamados em andamento',
      icone: AlertTriangle,
      cor: 'text-warning-foreground bg-warning/15',
    },
  ];
  // Desenho da tela (JSX).
  return (
    <AppLayout
      titulo={`Olá, ${usuario?.nome.split(' ')[0]} 👋`}
      subtitulo={`Visão geral${condominio ? ` do ${condominio.nome}` : ''} · ${usuario?.cargo}`}
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
        {podeReservar && (
          <Button className="rounded-xl" onClick={() => router.push('/reservas')}>
            <CalendarPlus className="h-4 w-4" /> Nova Reserva
          </Button>
        )}
        <Button
          className="rounded-xl"
          onClick={() => router.push(ehMorador ? '/visitantes' : '/portaria')}
        >
          <DoorOpen className="h-4 w-4" /> Liberar Visitante
        </Button>
        <Button className="rounded-xl" onClick={() => router.push('/chamados')}>
          <ClipboardList className="h-4 w-4" /> Registrar Ocorrência
        </Button>
        <Button className="rounded-xl" onClick={() => router.push('/enquetes')}>
          <Vote className="h-4 w-4" />{' '}
          {perfil === 'sindico' ? 'Nova Enquete' : podeVotar ? 'Votar em Enquetes' : 'Ver Enquetes'}
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
            {avisos.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhum comunicado publicado.</p>
            )}
            {avisos.slice(0, 4).map((a) => (
              <article
                key={a.id}
                className="rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {a.prioridade === 'URGENTE' && (
                    <Badge className="rounded-full border-0 bg-destructive/10 text-destructive">
                      Urgente
                    </Badge>
                  )}
                  <Badge variant="outline" className="rounded-full">
                    {a.categoria}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatarData(dataLocal(a.publicadoEm))} · {a.autor}
                  </span>
                  {!a.lido && (
                    <button
                      onClick={() =>
                        confirmarLeitura(a.id)
                          .then(() => toast.success('Comunicado marcado como lido'))
                          .catch((e) => toast.error(e.message))
                      }
                      className="ml-auto text-xs font-semibold text-primary hover:underline"
                    >
                      Marcar como lido
                    </button>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-foreground">{a.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.corpo}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Votações abertas</h2>
              <button
                onClick={() => router.push('/enquetes')}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Ver todas
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {enquetesAbertas.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma votação aberta.</p>
              )}
              {enquetesAbertas.slice(0, 3).map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">
                      {e.pergunta}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      até {formatarData(dataLocal(e.encerraEm))} · {e.total}{' '}
                      {e.total === 1 ? 'voto' : 'votos'}
                    </p>
                  </div>
                  {podeVotar &&
                    (e.meuVoto ? (
                      <Badge className="shrink-0 rounded-full border-0 bg-success/10 text-success">
                        Votou
                      </Badge>
                    ) : (
                      <Badge className="shrink-0 rounded-full border-0 bg-warning/15 text-warning-foreground">
                        Falta votar
                      </Badge>
                    ))}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-base font-bold text-foreground">Agenda dos espaços</h2>
            <div className="mt-4 space-y-3">
              {reservas.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma reserva agendada.</p>
              )}
              {reservas.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-start gap-3">
                  <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                    {formatarData(dataLocal(r.inicio)).slice(0, 5)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{r.espaco}</p>
                    <p className="text-xs text-muted-foreground">
                      {turnoDaReserva(r.inicio, r.fim)?.rotulo}
                      {r.unidade ? ` · ${r.unidade}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
            <h2 className="text-base font-bold text-foreground">Movimento da portaria</h2>
            <div className="mt-4 space-y-3">
              {visitas.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma visita no momento.</p>
              )}
              {visitas.slice(0, 4).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{v.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.unidade} · previsão {formatarDataHora(v.previsao)}
                    </p>
                  </div>
                  <VisitaStatus status={v.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
