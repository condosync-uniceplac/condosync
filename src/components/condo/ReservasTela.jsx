'use client';

import { CalendarDays, CheckCircle2, Trash2, Users } from 'lucide-react';
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
import { ESPACOS, TURNOS, formatarData, useCondo } from '@/lib/condo-store';
import { cn } from '@/lib/utils';
export default function Reservas() {
  const { estado, usuario, criarReserva, cancelarReserva } = useCondo();
  const [espaco, setEspaco] = useState(null);
  const [data, setData] = useState('');
  const [turno, setTurno] = useState(TURNOS[0]);
  const [convidados, setConvidados] = useState('20');
  const abrir = (e) => {
    setEspaco(e);
    setData('');
    setTurno(TURNOS[0]);
    setConvidados('20');
  };
  const confirmar = () => {
    if (!espaco) return;
    if (!data) {
      toast.error('Escolha a data desejada para a reserva.');
      return;
    }
    const r = criarReserva({
      espacoId: espaco.id,
      espaco: espaco.nome,
      data,
      turno,
      responsavel: usuario?.nome ?? 'Morador',
      unidade: usuario?.cargo ?? 'Apto 104 - Bloco B',
      convidados: Number(convidados) || 0,
    });
    if (r.ok) {
      toast.success(`Reserva confirmada: ${espaco.nome} em ${formatarData(data)}`);
      setEspaco(null);
    } else {
      toast.error(r.mensagem);
    }
  };
  const ocupacao = (id) => estado.reservas.filter((r) => r.espacoId === id).length;
  return (
    <AppLayout
      titulo="Reservas de Áreas Comuns"
      subtitulo="Agende espaços do condomínio e acompanhe suas reservas ativas"
    >
      <Tabs defaultValue="espacos">
        <TabsList className="rounded-xl">
          <TabsTrigger value="espacos" className="rounded-lg">
            Espaços disponíveis
          </TabsTrigger>
          <TabsTrigger value="minhas" className="rounded-lg">
            Minhas Reservas Ativas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="espacos" className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ESPACOS.map((e) => (
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
                  <span className="font-semibold text-foreground">{e.taxa}</span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {ocupacao(e.id)} reserva(s) agendada(s)
                </p>
                <Button className="mt-4 rounded-xl" onClick={() => abrir(e)}>
                  Reservar espaço
                </Button>
              </article>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="minhas" className="mt-5">
          <div className="space-y-3">
            {estado.reservas.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhuma reserva ativa no momento.
              </p>
            )}
            {estado.reservas.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xs font-bold text-accent-foreground">
                  {formatarData(r.data).slice(0, 5)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{r.espaco}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(r.data)} · {r.turno} · {r.convidados} convidados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.responsavel} — {r.unidade}
                  </p>
                </div>
                <Badge className="rounded-full border-0 bg-success/15 text-success">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmada
                </Badge>
                <Button
                  variant="outline"
                  className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    cancelarReserva(r.id);
                    toast.success('Reserva cancelada com sucesso');
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Cancelar
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!espaco} onOpenChange={(o) => !o && setEspaco(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar {espaco?.nome}</DialogTitle>
            <DialogDescription>
              Escolha a data e o turno. O sistema valida automaticamente conflitos de horário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data da reserva</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(ev) => setData(ev.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Turno / horário</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {TURNOS.map((t) => {
                  const ocupado =
                    !!espaco &&
                    !!data &&
                    estado.reservas.some(
                      (r) =>
                        r.espacoId === espaco.id &&
                        r.data === data &&
                        (r.turno === t ||
                          r.turno.startsWith('Dia inteiro') ||
                          t.startsWith('Dia inteiro')),
                    );
                  return (
                    <button
                      key={t}
                      disabled={ocupado}
                      onClick={() => setTurno(t)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                        turno === t
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:border-primary/50',
                        ocupado && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {t}
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
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEspaco(null)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={confirmar}>
              Confirmar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
