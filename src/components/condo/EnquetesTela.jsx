'use client';

import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Lock,
  Plus,
  Trophy,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { dataLocal } from '@/lib/turnos';
import { useEnquetes } from '@/lib/useEnquetes';
import { cn } from '@/lib/utils';

const dataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const novoForm = () => ({ pergunta: '', descricao: '', encerraEm: '', opcoes: ['', ''] });

function CartaoEnquete({ enquete, podeVotar, podeCriar, onVotar, onEncerrar, ocupado }) {
  const { total, encerrada } = enquete;
  const maior = Math.max(0, ...enquete.opcoes.map((o) => o.votos));
  const clicavel = podeVotar && !encerrada;

  return (
    <Card className="rounded-2xl border-border/70 shadow-soft">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug">{enquete.pergunta}</CardTitle>
          <Badge variant="secondary" className="shrink-0 rounded-lg">
            <BarChart3 className="h-3.5 w-3.5" /> {total} {total === 1 ? 'voto' : 'votos'}
          </Badge>
        </div>
        {enquete.descricao && (
          <p className="whitespace-pre-line text-sm text-muted-foreground">{enquete.descricao}</p>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {encerrada ? (
            <>
              <Lock className="h-3.5 w-3.5" />
              {enquete.encerradaAntes ? 'Encerrada pelo síndico em ' : 'Encerrada em '}
              {dataHora(enquete.encerraEm)} · resultado final
            </>
          ) : (
            <>
              <CalendarClock className="h-3.5 w-3.5" />
              Votação aberta até {dataHora(enquete.encerraEm)} · criada por {enquete.criador}
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {enquete.opcoes.map((opcao) => {
          const percentual = total > 0 ? Math.round((opcao.votos / total) * 100) : 0;
          const escolhida = enquete.meuVoto === opcao.id;
          const vencedora = encerrada && total > 0 && opcao.votos === maior;
          return (
            <button
              key={opcao.id}
              type="button"
              disabled={!clicavel || ocupado || escolhida}
              onClick={() => onVotar(enquete, opcao)}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition-all',
                clicavel && !escolhida && 'hover:border-primary/60 hover:shadow-soft',
                !clicavel && 'cursor-default',
                escolhida ? 'border-primary bg-primary/5' : 'border-border/70',
                vencedora && 'border-success bg-success/5',
              )}
            >
              <div className="flex items-center justify-between gap-3 text-sm font-medium">
                <span className="flex items-center gap-2">
                  {escolhida && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  {vencedora && <Trophy className="h-4 w-4 text-success" />}
                  {opcao.texto}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {percentual}% · {opcao.votos}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    vencedora ? 'bg-success' : 'bg-primary',
                  )}
                  style={{ width: `${percentual}%` }}
                />
              </div>
            </button>
          );
        })}

        {enquete.meuVoto && (
          <p className="text-xs text-muted-foreground">
            {enquete.votadoPor
              ? `O voto da sua unidade foi registrado por ${enquete.votadoPor}.`
              : 'O voto da sua unidade foi registrado.'}{' '}
            {!encerrada && 'Pode ser alterado até o encerramento (vale o último voto da unidade).'}
          </p>
        )}
        {clicavel && !enquete.meuVoto && (
          <p className="text-xs text-muted-foreground">
            Um voto por unidade. Toque em uma opção para votar.
          </p>
        )}
        {!podeVotar && !encerrada && (
          <p className="text-xs text-muted-foreground">
            Você acompanha o resultado parcial; votam os moradores de cada unidade.
          </p>
        )}

        {podeCriar && !encerrada && (
          <div className="border-t border-border pt-3">
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={ocupado}
              onClick={() => onEncerrar(enquete)}
            >
              <Lock className="h-3.5 w-3.5" /> Encerrar votação agora
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** RN.24 (versão 2): síndico cria e encerra; um voto por unidade, alterável até o fim. */
export default function Enquetes() {
  const { podeCriar, podeVotar, enquetes, carregando, erro, criar, votar, encerrar } =
    useEnquetes();
  const [ocupado, setOcupado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(novoForm);
  const [salvando, setSalvando] = useState(false);

  const abertas = enquetes.filter((e) => !e.encerrada);
  const encerradas = enquetes.filter((e) => e.encerrada);

  const executar = async (acao, sucesso) => {
    setOcupado(true);
    try {
      await acao();
      toast.success(sucesso);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const onVotar = (enquete, opcao) =>
    executar(
      () => votar(enquete.id, opcao.id),
      enquete.meuVoto ? `Voto alterado: ${opcao.texto}` : `Voto registrado: ${opcao.texto}`,
    );

  const onEncerrar = (enquete) => {
    if (
      !window.confirm(
        `Encerrar a votação "${enquete.pergunta}"? Depois disso ninguém mais vota e o resultado fica definitivo.`,
      )
    )
      return;
    executar(() => encerrar(enquete.id), 'Votação encerrada.');
  };

  const setOpcao = (i, v) =>
    setForm((f) => ({ ...f, opcoes: f.opcoes.map((o, j) => (j === i ? v : o)) }));

  const salvar = async () => {
    setSalvando(true);
    try {
      await criar(form);
      toast.success('Enquete publicada para os moradores.');
      setAberto(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const hoje = dataLocal(new Date());

  const grade = (lista) => (
    <div className="grid gap-5 lg:grid-cols-2">
      {lista.map((e) => (
        <CartaoEnquete
          key={e.id}
          enquete={e}
          podeVotar={podeVotar}
          podeCriar={podeCriar}
          onVotar={onVotar}
          onEncerrar={onEncerrar}
          ocupado={ocupado}
        />
      ))}
    </div>
  );

  return (
    <AppLayout
      titulo="Enquetes e Votações"
      subtitulo="Participe das decisões da comunidade e acompanhe os resultados"
    >
      {podeCriar && (
        <Button
          className="rounded-xl"
          onClick={() => {
            setForm(novoForm());
            setAberto(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nova enquete
        </Button>
      )}

      {erro && <p className="mt-4 text-sm text-destructive">{erro}</p>}
      {carregando && <p className="mt-4 text-sm text-muted-foreground">Carregando enquetes...</p>}

      {!carregando && (
        <>
          <h2 className="mb-3 mt-5 text-sm font-bold text-foreground">
            Votações abertas ({abertas.length})
          </h2>
          {abertas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhuma votação aberta no momento.
            </p>
          ) : (
            grade(abertas)
          )}

          {encerradas.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-sm font-bold text-foreground">
                Encerradas ({encerradas.length})
              </h2>
              {grade(encerradas)}
            </>
          )}
        </>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova enquete</DialogTitle>
            <DialogDescription>
              Cada unidade tem um voto, que pode ser alterado até o encerramento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="q-pergunta">Pergunta</Label>
              <Input
                id="q-pergunta"
                value={form.pergunta}
                onChange={(e) => setForm({ ...form, pergunta: e.target.value })}
                placeholder="ex: Devemos pintar a fachada em dezembro?"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-desc">Descrição (opcional)</Label>
              <Textarea
                id="q-desc"
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Contexto, valores envolvidos, prazos..."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-fim">Votação aberta até (inclusive)</Label>
              <Input
                id="q-fim"
                type="date"
                min={hoje}
                value={form.encerraEm}
                onChange={(e) => setForm({ ...form, encerraEm: e.target.value })}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Encerra às 23:59 do dia escolhido (no máximo 90 dias).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Opções</Label>
              {form.opcoes.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    aria-label={`Opção ${i + 1}`}
                    value={o}
                    onChange={(e) => setOpcao(i, e.target.value)}
                    placeholder={`Opção ${i + 1}`}
                    className="h-10 rounded-xl"
                  />
                  {form.opcoes.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover opção ${i + 1}`}
                      onClick={() =>
                        setForm((f) => ({ ...f, opcoes: f.opcoes.filter((_, j) => j !== i) }))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {form.opcoes.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setForm((f) => ({ ...f, opcoes: [...f.opcoes, ''] }))}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar opção
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar enquete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
