'use client';

/**
 * Tela de Chamados: quadro Aberto/Em análise/Resolvido, abertura com foto e detalhe com
 * histórico. Os botões de status aparecem conforme o perfil (RN.22).
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { ImageIcon, Loader2, MessageSquare, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { SELECT_CLASSE } from '@/components/condo/campos-visitante';
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
import { Textarea } from '@/components/ui/textarea';
import { useChamados } from '@/lib/useChamados';
import { cn } from '@/lib/utils';

// Colunas do quadro e rótulos de status, urgência e perfil.
const COLUNAS = [
  { id: 'ABERTO', titulo: 'Aberto', cor: 'bg-destructive' },
  { id: 'EM_ANALISE', titulo: 'Em Análise', cor: 'bg-warning' },
  { id: 'RESOLVIDO', titulo: 'Resolvido', cor: 'bg-success' },
];
const ROTULO_STATUS = { ABERTO: 'Aberto', EM_ANALISE: 'Em análise', RESOLVIDO: 'Resolvido' };
const URGENCIA = {
  ALTA: { rotulo: 'Alta', classe: 'bg-destructive/10 text-destructive' },
  MEDIA: { rotulo: 'Média', classe: 'bg-warning/15 text-warning-foreground' },
  BAIXA: { rotulo: 'Baixa', classe: 'bg-muted text-muted-foreground' },
};
const PERFIL = { MORADOR: 'Morador', PORTARIA: 'Portaria', SINDICO: 'Síndico', ADMIN: 'Admin' };
const vazio = { titulo: '', descricao: '', categoriaId: '', urgencia: 'MEDIA' };

// Data e hora no fuso de Brasília.
const dataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Texto do botão de cada transição permitida. */
function rotuloAcao(atual, destino) {
  if (destino === 'RESOLVIDO') return 'Marcar como resolvido';
  if (atual === 'RESOLVIDO') return `Reabrir (${ROTULO_STATUS[destino]})`;
  if (destino === 'EM_ANALISE') return 'Mover para Em análise';
  return 'Voltar para Aberto';
}

// Etiqueta colorida da urgência.
function UrgenciaBadge({ urgencia }) {
  const u = URGENCIA[urgencia];
  return (
    <Badge className={cn('rounded-full border-0 text-[10px]', u.classe)}>Urgência {u.rotulo}</Badge>
  );
}

/** RN.22 (versão 2) / bug #18: o status só muda conforme o perfil, e tudo fica no histórico. */
export default function Chamados() {
  const {
    perfil,
    podeComentar,
    categorias,
    chamados,
    carregando,
    erro,
    abrir,
    alterarStatus,
    comentar,
    detalhar,
  } = useChamados();
  // Morador vê só os próprios chamados e não muda status.
  const ehMorador = perfil === 'MORADOR';

  // Estado do formulário de novo chamado.
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState(vazio);
  const [arquivo, setArquivo] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Estado do detalhe: chamado aberto, histórico, comentário digitado e ação em andamento.
  const [aberto, setAberto] = useState(null); // id do chamado no detalhe
  const [detalhe, setDetalhe] = useState(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Abre o formulário de novo chamado com a primeira categoria selecionada.
  const abrirNovo = () => {
    setForm({ ...vazio, categoriaId: categorias[0] ? String(categorias[0].id) : '' });
    setArquivo(null);
    setNovo(true);
  };

  // Envia o novo chamado (com a foto, se houver).
  const enviar = async () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (arquivo) fd.append('anexo', arquivo);
    setSalvando(true);
    try {
      await abrir(fd);
      toast.success('Chamado aberto! A administração foi notificada.');
      setNovo(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  // Busca o chamado com o histórico.
  const carregarDetalhe = useCallback(
    async (id) => {
      try {
        setDetalhe(await detalhar(id));
      } catch (e) {
        toast.error(e.message);
        setAberto(null);
      }
    },
    [detalhar],
  );

  // Ao abrir/fechar o detalhe, carrega os dados e limpa o comentário.
  useEffect(() => {
    if (aberto) carregarDetalhe(aberto);
    else setDetalhe(null);
    setComentario('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  // Executa uma ação, mostra o aviso e recarrega o detalhe.
  const executar = async (chave, acao, sucesso) => {
    setEnviando(chave);
    try {
      await acao();
      toast.success(sucesso);
      setComentario('');
      await carregarDetalhe(aberto);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(null);
    }
  };

  // Muda o status (levando o comentário, se houver).
  const mover = (destino) =>
    executar(
      destino,
      () => alterarStatus(aberto, destino, comentario.trim() || undefined),
      `Chamado movido para "${ROTULO_STATUS[destino]}".`,
    );

  // Registra só o comentário.
  const registrarComentario = () =>
    executar('comentario', () => comentar(aberto, comentario.trim()), 'Acompanhamento registrado.');

  const c = detalhe?.chamado;

  // Desenho da tela (JSX).
  return (
    <AppLayout
      titulo="Chamados & Ocorrências"
      subtitulo={
        ehMorador
          ? 'Registre ocorrências e acompanhe a resolução pela administração'
          : 'Ocorrências do condomínio e o andamento de cada uma'
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button className="rounded-xl" onClick={abrirNovo} disabled={carregando}>
          <Plus className="h-4 w-4" /> Registrar Ocorrência
        </Button>
        {ehMorador && (
          <p className="text-xs text-muted-foreground">
            Você vê apenas os chamados que abriu. Somente a administração altera o status.
          </p>
        )}
        {perfil === 'PORTARIA' && (
          <p className="text-xs text-muted-foreground">
            A portaria move chamados de Aberto para Em análise e registra acompanhamentos.
          </p>
        )}
      </div>

      {erro && <p className="mt-4 text-sm text-destructive">{erro}</p>}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {COLUNAS.map((col) => {
          const itens = chamados.filter((x) => x.status === col.id);
          return (
            <section key={col.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', col.cor)} />
                <h2 className="text-sm font-bold text-foreground">{col.titulo}</h2>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {itens.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {carregando && <p className="text-xs text-muted-foreground">Carregando...</p>}
                {!carregando && itens.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Nenhum chamado nesta etapa.
                  </p>
                )}
                {itens.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setAberto(x.id)}
                    className="block w-full rounded-xl border border-border bg-background p-4 text-left shadow-[var(--shadow-soft)] transition-colors hover:border-primary/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {x.categoria}
                      </Badge>
                      <UrgenciaBadge urgencia={x.urgencia} />
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-foreground">{x.titulo}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{x.descricao}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      #{x.id} · {x.solicitante}
                      {x.unidade ? ` · ${x.unidade}` : ` · ${PERFIL[x.perfilSolicitante]}`} ·{' '}
                      {dataHora(x.criadoEm)}
                    </p>
                    {(x.anexos.length > 0 || x.comentarios > 0) && (
                      <p className="mt-2 flex gap-3 text-[11px] font-semibold text-primary">
                        {x.anexos.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" /> Foto
                          </span>
                        )}
                        {x.comentarios > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" /> {x.comentarios}
                          </span>
                        )}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Novo chamado */}
      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova ocorrência</DialogTitle>
            <DialogDescription>
              Descreva o ocorrido para que a administração possa tomar as providências.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-titulo">Título</Label>
              <Input
                id="c-titulo"
                value={form.titulo}
                onChange={set('titulo')}
                placeholder="ex: Infiltração na garagem do Bloco B"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-cat">Categoria</Label>
                <select
                  id="c-cat"
                  value={form.categoriaId}
                  onChange={set('categoriaId')}
                  className={SELECT_CLASSE}
                >
                  {categorias.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-urg">Urgência</Label>
                <select
                  id="c-urg"
                  value={form.urgencia}
                  onChange={set('urgencia')}
                  className={SELECT_CLASSE}
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-desc">Descrição</Label>
              <Textarea
                id="c-desc"
                rows={4}
                value={form.descricao}
                onChange={set('descricao')}
                placeholder="Detalhe o que aconteceu, local e horário."
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-foto">Foto (opcional)</Label>
              <Input
                id="c-foto"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">PNG, JPG ou PDF de até 2 MB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setNovo(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={enviar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              Abrir chamado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detalhe + acompanhamento */}
      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-xl">
          {!c ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>
                  #{c.id} · {c.titulo}
                </DialogTitle>
                <DialogDescription>
                  {c.solicitante}
                  {c.unidade ? ` · ${c.unidade}` : ` · ${PERFIL[c.perfilSolicitante]}`} · aberto em{' '}
                  {dataHora(c.criadoEm)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full">{ROTULO_STATUS[c.status]}</Badge>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {c.categoria}
                </Badge>
                <UrgenciaBadge urgencia={c.urgencia} />
              </div>
              <p className="whitespace-pre-line text-sm text-foreground">{c.descricao}</p>

              {c.anexos.map((x) =>
                x.mime.startsWith('image/') ? (
                  <a
                    key={x.id}
                    href={`/api/chamados/${c.id}/anexos/${x.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/chamados/${c.id}/anexos/${x.id}`}
                      alt={`Foto do chamado #${c.id}`}
                      className="max-h-64 rounded-xl border border-border object-contain"
                    />
                  </a>
                ) : (
                  <a
                    key={x.id}
                    href={`/api/chamados/${c.id}/anexos/${x.id}`}
                    download={x.nome}
                    className="text-sm font-semibold text-primary underline"
                  >
                    📎 {x.nome}
                  </a>
                ),
              )}

              <div>
                <h3 className="text-sm font-bold text-foreground">Acompanhamento</h3>
                <ol className="mt-2 space-y-2 border-l-2 border-border pl-4">
                  <li className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Chamado aberto</span> por{' '}
                    {c.solicitante} · {dataHora(c.criadoEm)}
                  </li>
                  {detalhe.historico.map((h) => (
                    <li key={h.id} className="text-xs text-muted-foreground">
                      {h.novoStatus && (
                        <span className="font-semibold text-foreground">
                          Movido para {ROTULO_STATUS[h.novoStatus]}{' '}
                        </span>
                      )}
                      <span>
                        {h.novoStatus ? 'por' : 'Comentário de'} {h.autor} ({PERFIL[h.perfil]}) ·{' '}
                        {dataHora(h.criadoEm)}
                      </span>
                      {h.comentario && (
                        <p className="mt-1 whitespace-pre-line rounded-lg bg-muted p-2 text-foreground">
                          {h.comentario}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {(detalhe.podeComentar || c.transicoes.length > 0) && (
                <div className="space-y-2 border-t border-border pt-3">
                  <Label htmlFor="c-coment">
                    {detalhe.podeComentar ? 'Comentário' : 'Comentário (opcional)'}
                  </Label>
                  <Textarea
                    id="c-coment"
                    rows={3}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="ex: Zelador acionado, troca prevista para amanhã."
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    O comentário vai junto com a mudança de status, ou pode ser registrado sozinho.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.transicoes.map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === 'RESOLVIDO' ? 'default' : 'outline'}
                        className="rounded-lg"
                        disabled={!!enviando}
                        onClick={() => mover(s)}
                      >
                        {enviando === s && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {rotuloAcao(c.status, s)}
                      </Button>
                    ))}
                    {detalhe.podeComentar && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="rounded-lg"
                        disabled={!!enviando || comentario.trim().length < 3}
                        onClick={registrarComentario}
                      >
                        {enviando === 'comentario' && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Registrar comentário
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {ehMorador && (
                <p className="text-xs text-muted-foreground">
                  Somente a administração do condomínio altera o status deste chamado.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
