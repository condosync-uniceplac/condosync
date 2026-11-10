'use client';

/**
 * Tela Meus Visitantes (morador): pré-autorizar visitante, ver o código do convite e
 * confirmar/recusar quem chegou sem aviso (RN.14).
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { BellRing, Check, Loader2, Ticket, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { CamposVisitante } from '@/components/condo/campos-visitante';
import { VisitaStatus, formatarDataHora } from '@/components/condo/VisitaStatus';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVisitas } from '@/lib/useVisitas';

// Formulário vazio da pré-autorização.
const vazio = { nome: '', tipoDocumento: 'CPF', documento: '', previsao: '', placa: '' };

export default function Visitantes() {
  // Visitas da unidade vêm do hook useVisitas.
  const { visitas, carregando, erro, criar, acao } = useVisitas();
  const [form, setForm] = useState(vazio);
  const [convite, setConvite] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const aguardando = visitas.filter((v) => v.status === 'AGUARDANDO');
  const demais = visitas.filter((v) => v.status !== 'AGUARDANDO');

  // Pré-autoriza o visitante e mostra o código do convite.
  const autorizar = async () => {
    setEnviando(true);
    try {
      const v = await criar(form);
      setConvite({ codigo: v.convite, nome: form.nome });
      setForm(vazio);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  // Autoriza, recusa ou cancela uma visita.
  const executar = async (v, nome, mensagem) => {
    try {
      await acao(v.id, nome);
      toast.success(mensagem);
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Desenho da tela (JSX).
  return (
    <AppLayout
      titulo="Meus Visitantes"
      subtitulo="Pré-autorize visitas e confirme quem chegou na portaria sem aviso"
    >
      {erro && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </p>
      )}

      {aguardando.map((v) => (
        <div
          key={v.id}
          className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-warning/40 bg-warning/10 p-4"
        >
          <BellRing className="h-5 w-5 text-warning-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">
              {v.nome} está na portaria aguardando sua confirmação
            </p>
            <p className="text-xs text-muted-foreground">
              {v.documento}
              {v.placa ? ` · Placa ${v.placa}` : ''} · chegou {formatarDataHora(v.previsao)}
            </p>
          </div>
          <Button
            className="rounded-xl"
            onClick={() => executar(v, 'AUTORIZAR', `Entrada de ${v.nome} autorizada`)}
          >
            <Check className="h-4 w-4" /> Autorizar entrada
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => executar(v, 'RECUSAR', `Visita de ${v.nome} recusada`)}
          >
            <X className="h-4 w-4" /> Recusar
          </Button>
        </div>
      ))}

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <section className="h-fit rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserPlus className="h-4.5 w-4.5 text-primary" /> Pré-autorizar visitante
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            A portaria libera a entrada sem precisar ligar para você.
          </p>
          <div className="mt-4 space-y-3">
            <CamposVisitante form={form} setForm={setForm} />
            <div className="space-y-1.5">
              <Label htmlFor="previsao">Data e horário previstos</Label>
              <Input
                id="previsao"
                type="datetime-local"
                value={form.previsao}
                onChange={(e) => setForm({ ...form, previsao: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>
            <Button className="mt-2 h-11 w-full rounded-xl" onClick={autorizar} disabled={enviando}>
              {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Pré-autorizar visitante
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-bold text-foreground">Visitas da minha unidade</h2>
          <div className="mt-4 space-y-3">
            {!carregando && demais.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhuma visita registrada nos últimos dias.
              </p>
            )}
            {demais.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{v.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.documento} · previsto para {formatarDataHora(v.previsao)}
                    {v.placa ? ` · Placa ${v.placa}` : ''}
                  </p>
                  {v.status === 'AUTORIZADO' && v.autorizacaoVia === 'PRE_AUTORIZACAO' && (
                    <p className="text-xs font-semibold text-primary">
                      Código do convite: {v.convite}
                    </p>
                  )}
                </div>
                <VisitaStatus status={v.status} via={v.autorizacaoVia} />
                {v.status === 'AUTORIZADO' && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => executar(v, 'CANCELAR', `Autorização de ${v.nome} cancelada`)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={!!convite} onOpenChange={(o) => !o && setConvite(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Visitante pré-autorizado</DialogTitle>
            <DialogDescription>
              Envie o código abaixo para {convite?.nome}. Na portaria, basta informar o nome ou o
              código.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <Ticket className="h-10 w-10 text-primary" />
            <p className="text-2xl font-bold tracking-widest text-primary">{convite?.codigo}</p>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
