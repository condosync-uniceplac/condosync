'use client';

/**
 * Tela de Reservas: espaços disponíveis, nova reserva por turno, minhas reservas e,
 * para o síndico/portaria, as reservas do condomínio (RF.09 / RN.12).
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { CalendarDays, CheckCircle2, Loader2, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ANTECEDENCIA_CANCELAMENTO_HORAS,
  TURNOS,
  dataLocal,
  intervaloDoTurno,
  sobrepoe,
  turnoDaReserva,
} from '@/lib/turnos';
import { useReservas } from '@/lib/useReservas';
import { cn } from '@/lib/utils';

// Formatações de data e de valor em reais.
const formatarData = (iso) => {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
};
const taxa = (valor) =>
  valor > 0 ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Isento';

export default function Reservas() {
  // Dados e ações vêm do hook useReservas.
  const { podeReservar, espacos, reservas, ocupacao, carregando, erro, criar, cancelar } =
    useReservas();
  // Estado do formulário de reserva (espaço, data, turno e convidados).
  const [espaco, setEspaco] = useState(null);
  const [data, setData] = useState('');
  const [turno, setTurno] = useState(TURNOS[0].id);
  const [convidados, setConvidados] = useState('10');
  const [enviando, setEnviando] = useState(false);
  const hoje = dataLocal(new Date());

  // Abre o formulário de reserva do espaço escolhido.
  const abrir = (e) => {
    setEspaco(e);
    setData('');
    setTurno(TURNOS[0].id);
    setConvidados(String(Math.min(10, e.capacidade)));
  };

  // O turno fica indisponível se já há reserva que se sobrepõe nesse espaço e data.
  const indisponivel = (turnoId) => {
    if (!espaco || !data) return false;
    const intervalo = intervaloDoTurno(data, turnoId);
    if (intervalo.inicio <= new Date()) return true;
    return ocupacao.some((o) => o.espacoId === espaco.id && sobrepoe(o, intervalo));
  };

  // Envia a reserva.
  const confirmar = async () => {
    if (!espaco) return;
    if (!data) {
      toast.error('Escolha a data desejada para a reserva.');
      return;
    }
    if (indisponivel(turno)) {
      toast.error('Este turno não está disponível. Escolha outro horário.');
      return;
    }
    setEnviando(true);
    try {
      await criar({ espacoId: espaco.id, data, turno, convidados: Number(convidados) });
      toast.success(`Reserva confirmada: ${espaco.nome} em ${formatarData(data)}`);
      setEspaco(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  // Cancela uma reserva depois de confirmar.
  const onCancelar = async (r) => {
    try {
      await cancelar(r.id);
      toast.success('Reserva cancelada com sucesso');
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Quantas reservas futuras o espaço tem.
  const agendadas = (id) => ocupacao.filter((o) => o.espacoId === id).length;

  // Desenho da tela (JSX).
  return (
    <AppLayout
      titulo="Reservas de Áreas Comuns"
      subtitulo={
        podeReservar
          ? 'Agende espaços do condomínio e acompanhe suas reservas ativas'
          : 'Acompanhe a agenda dos espaços do condomínio'
      }
    >
      {erro && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </p>
      )}
      <Tabs defaultValue="espacos">
        <TabsList className="rounded-xl">
          <TabsTrigger value="espacos" className="rounded-lg">
            Espaços disponíveis
          </TabsTrigger>
          <TabsTrigger value="minhas" className="rounded-lg">
            {podeReservar ? 'Minhas Reservas Ativas' : 'Reservas do condomínio'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="espacos" className="mt-5">
          {carregando && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando espaços...
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {espacos.map((e) => (
              <article
                key={e.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex h-24 items-center justify-center rounded-xl bg-accent">
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
                <h2 className="mt-4 text-sm font-bold text-foreground">{e.nome}</h2>
                <p className="mt-1 flex-1 text-xs text-muted-foreground">{e.descricao}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {e.capacidade} pessoas
                  </span>
                  <span className="font-semibold text-foreground">{taxa(e.valor)}</span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {agendadas(e.id)} reserva(s) agendada(s)
                </p>
                {podeReservar && (
                  <Button className="mt-4 rounded-xl" onClick={() => abrir(e)}>
                    Reservar espaço
                  </Button>
                )}
              </article>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="minhas" className="mt-5">
          <div className="space-y-3">
            {!carregando && reservas.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhuma reserva ativa no momento.
              </p>
            )}
            {reservas.map((r) => {
              const dia = dataLocal(r.inicio);
              const t = turnoDaReserva(r.inicio, r.fim);
              const podeCancelar = r.minha || !podeReservar;
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xs font-bold text-accent-foreground">
                    {formatarData(dia).slice(0, 5)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">{r.espaco}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarData(dia)} · {t?.rotulo ?? 'Horário personalizado'} · {r.convidados}{' '}
                      convidados
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.responsavel}
                      {r.unidade ? ` — ${r.unidade}` : ''}
                    </p>
                  </div>
                  <Badge className="rounded-full border-0 bg-success/15 text-success">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmada
                  </Badge>
                  {podeCancelar && (
                    <Button
                      variant="outline"
                      className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onCancelar(r)}
                    >
                      <Trash2 className="h-4 w-4" /> Cancelar
                    </Button>
                  )}
                </div>
              );
            })}
            {podeReservar && reservas.length > 0 && (
              <p className="text-xs text-muted-foreground">
                O cancelamento é permitido até {ANTECEDENCIA_CANCELAMENTO_HORAS} h antes do início.
                Depois disso, procure o síndico.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!espaco} onOpenChange={(o) => !o && setEspaco(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar {espaco?.nome}</DialogTitle>
            <DialogDescription>
              Escolha a data e o turno. Horários já ocupados aparecem como indisponíveis, e você não
              pode ter duas reservas no mesmo horário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data da reserva</Label>
              <Input
                id="data"
                type="date"
                min={hoje}
                value={data}
                onChange={(ev) => setData(ev.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Turno / horário</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {TURNOS.map((t) => {
                  const ocupado = indisponivel(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={ocupado}
                      onClick={() => setTurno(t.id)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                        turno === t.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:border-primary/50',
                        ocupado && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {t.rotulo}
                      {ocupado && (
                        <span className="block text-[10px] font-normal">Indisponível</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="convidados">Número de convidados</Label>
              <Input
                id="convidados"
                type="number"
                min={1}
                max={espaco?.capacidade}
                value={convidados}
                onChange={(ev) => setConvidados(ev.target.value)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Máximo de {espaco?.capacidade} pessoas neste espaço.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEspaco(null)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={confirmar} disabled={enviando}>
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
