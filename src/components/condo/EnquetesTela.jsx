'use client';

/**
 * Tela de Enquetes: votações abertas e encerradas, voto por unidade e, para o síndico,
 * criar e encerrar (RN.24).
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

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
import { Campo, LegendaObrigatorio, Sugestoes, faltando, useErros } from '@/components/condo/campo';
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

// Formulário vazio de nova enquete (começa com 2 opções).
// Conjuntos de opções prontos (o síndico clica em vez de digitar cada opção).
const MODELOS_OPCOES = [
  { rotulo: 'Sim / Não', valor: ['Sim', 'Não'] },
  { rotulo: 'Sim / Não / Abstenção', valor: ['Sim', 'Não', 'Abstenção'] },
  { rotulo: 'Concordo / Discordo', valor: ['Concordo', 'Discordo'] },
  { rotulo: 'Manhã / Tarde / Noite', valor: ['Manhã', 'Tarde', 'Noite'] },
];

const novoForm = () => ({ pergunta: '', descricao: '', encerraEm: '', opcoes: ['', ''] });

// Cartão de uma enquete: opções com a porcentagem, o voto da unidade e a vencedora (se encerrada).
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
  // Dados e ações vêm do hook useEnquetes.
  const { podeCriar, podeVotar, enquetes, carregando, erro, criar, votar, encerrar } =
    useEnquetes();
  const [ocupado, setOcupado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(novoForm);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useErros(form);

  const abertas = enquetes.filter((e) => !e.encerrada);
  const encerradas = enquetes.filter((e) => e.encerrada);

  // Executa uma ação (votar/encerrar) mostrando o aviso de sucesso ou erro.
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

  // Vota ou troca o voto da unidade.
  const onVotar = (enquete, opcao) =>
    executar(
      () => votar(enquete.id, opcao.id),
      enquete.meuVoto ? `Voto alterado: ${opcao.texto}` : `Voto registrado: ${opcao.texto}`,
    );

  // Encerra a votação depois de confirmar.
  const onEncerrar = (enquete) => {
    if (
      !window.confirm(
        `Encerrar a votação "${enquete.pergunta}"? Depois disso ninguém mais vota e o resultado fica definitivo.`,
      )
    )
      return;
    executar(() => encerrar(enquete.id), 'Votação encerrada.');
  };

  // Atualiza o texto de uma opção no formulário.
  const setOpcao = (i, v) =>
    setForm((f) => ({ ...f, opcoes: f.opcoes.map((o, j) => (j === i ? v : o)) }));

  // Publica a nova enquete.
  const salvar = async () => {
    // Confere os obrigatórios antes de enviar (inclusive opções em branco).
    const vazios = faltando(form, ['pergunta', 'encerraEm']);
    if (form.opcoes.some((o) => !o.trim())) vazios.opcoes = 'Preencha todas as opções.';
    setErros(vazios);
    if (Object.keys(vazios).length) {
      toast.error('Preencha os campos obrigatórios destacados.');
      return;
    }
    setSalvando(true);
    try {
      await criar(form);
      toast.success('Enquete publicada para os moradores.');
      setAberto(false);
    } catch (e) {
      // Erros de uma opção específica (opcoes.1) aparecem no bloco de opções.
      const campos = e.campos ?? {};
      const opcao = Object.entries(campos).find(([k]) => k.startsWith('opcoes'));
      setErros({ ...campos, ...(opcao ? { opcoes: opcao[1] } : {}) });
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const hoje = dataLocal(new Date());
  // Atalhos de prazo: daqui a 7, 15 e 30 dias.
  const prazos = [7, 15, 30].map((n) => ({
    rotulo: `${n} dias`,
    valor: dataLocal(new Date(Date.now() + n * 86_400_000)),
  }));

  // Grade de cartões (usada para abertas e encerradas).
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
            setErros({});
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
            <LegendaObrigatorio />
            <Campo id="q-pergunta" label="Pergunta" obrigatorio erro={erros.pergunta}>
              <Input
                id="q-pergunta"
                value={form.pergunta}
                onChange={(e) => setForm({ ...form, pergunta: e.target.value })}
                placeholder="ex: Devemos pintar a fachada em dezembro?"
                className="h-11 rounded-xl"
              />
            </Campo>
            <Campo id="q-desc" label="Descrição (opcional)" erro={erros.descricao}>
              <Textarea
                id="q-desc"
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Contexto, valores envolvidos, prazos..."
                className="rounded-xl"
              />
            </Campo>
            <Campo
              id="q-fim"
              label="Votação aberta até (inclusive)"
              obrigatorio
              erro={erros.encerraEm}
              dica="Encerra às 23:59 do dia escolhido (no máximo 90 dias)."
            >
              <Input
                id="q-fim"
                type="date"
                min={hoje}
                value={form.encerraEm}
                onChange={(e) => setForm({ ...form, encerraEm: e.target.value })}
                className="h-11 rounded-xl"
              />
              <Sugestoes
                rotulo="Prazo:"
                itens={prazos}
                ativo={prazos.find((p) => p.valor === form.encerraEm)?.rotulo}
                onEscolher={(v) => setForm({ ...form, encerraEm: v })}
              />
            </Campo>
            <Campo
              id="q-opcao-1"
              label="Opções"
              obrigatorio
              erro={erros.opcoes}
              dica="De 2 a 10 opções, sem repetir."
            >
              <Sugestoes
                rotulo="Modelos:"
                itens={MODELOS_OPCOES}
                ativo={
                  MODELOS_OPCOES.find((m) => m.valor.join('|') === form.opcoes.join('|'))?.rotulo
                }
                onEscolher={(v) => setForm({ ...form, opcoes: [...v] })}
              />
              {form.opcoes.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    id={`q-opcao-${i + 1}`}
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
            </Campo>
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
