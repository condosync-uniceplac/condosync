'use client';

/**
 * Tela do Mural de Avisos: filtro por categoria, leitura, anexos e, para o síndico,
 * publicar/editar/remover.
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { CheckCircle2, Download, FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { useAvisos } from '@/lib/useAvisos';
import { cn } from '@/lib/utils';

// Formulário vazio e funções de formatação (data/hora, tamanho e tipo do arquivo).
const vazio = { titulo: '', corpo: '', categoriaId: '', prioridade: 'NORMAL' };
const dataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
const tamanho = (b) =>
  b < 1024 * 1024 ? `${Math.ceil(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;
const TIPO = { 'application/pdf': 'PDF', 'image/png': 'PNG', 'image/jpeg': 'JPG' };

/** RN.20 (versão 2): só o síndico publica; categoria e urgência separadas; leitura e anexos. */
export default function Avisos() {
  // Categoria escolhida no filtro; os dados vêm do hook useAvisos.
  const [filtro, setFiltro] = useState(null);
  const {
    podePublicar,
    categorias,
    avisos,
    carregando,
    erro,
    publicar,
    editar,
    remover,
    confirmarLeitura,
  } = useAvisos(filtro);
  // Estado do formulário de publicação/edição.
  const [editando, setEditando] = useState(null); // null fechado; {} novo; aviso = edição
  const [form, setForm] = useState(vazio);
  const [arquivo, setArquivo] = useState(null);
  const [removerAnexo, setRemoverAnexo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Abre o formulário: vazio para novo aviso ou preenchido para editar.
  const abrir = (a) => {
    setEditando(a ?? {});
    setArquivo(null);
    setRemoverAnexo(false);
    setForm(
      a
        ? {
            titulo: a.titulo,
            corpo: a.corpo,
            categoriaId: String(a.categoriaId),
            prioridade: a.prioridade,
          }
        : { ...vazio, categoriaId: categorias[0] ? String(categorias[0].id) : '' },
    );
  };

  // Monta o formulário com o arquivo e envia (publicar ou editar).
  const salvar = async () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (arquivo) fd.append('anexo', arquivo);
    if (removerAnexo) fd.append('removerAnexo', 'true');
    setSalvando(true);
    try {
      if (editando?.id) {
        await editar(editando.id, fd);
        toast.success('Aviso atualizado.');
      } else {
        await publicar(fd);
        toast.success('Aviso publicado no mural.');
      }
      setEditando(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  // Remove o aviso depois de confirmar.
  const excluir = async (a) => {
    if (!window.confirm(`Remover o aviso "${a.titulo}"? Ele some do mural para todos.`)) return;
    try {
      await remover(a.id);
      toast.success('Aviso removido.');
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Confirma a leitura do aviso.
  const ler = async (a) => {
    try {
      await confirmarLeitura(a.id);
      toast.success('Leitura confirmada');
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Atualiza um campo do formulário.
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Desenho da tela (JSX).
  return (
    <AppLayout
      titulo="Mural de Avisos"
      subtitulo="Comunicados publicados pela administração do condomínio"
    >
      <div className="flex flex-wrap items-center gap-2">
        {[{ id: null, nome: 'Todos' }, ...categorias].map((c) => (
          <button
            key={c.id ?? 'todos'}
            onClick={() => setFiltro(c.id)}
            className={cn(
              'rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
              filtro === c.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            )}
          >
            {c.nome}
          </button>
        ))}
        {podePublicar && (
          <Button className="ml-auto rounded-xl" onClick={() => abrir(null)}>
            <Plus className="h-4 w-4" /> Novo aviso
          </Button>
        )}
      </div>

      {erro && <p className="mt-4 text-sm text-destructive">{erro}</p>}
      {carregando && <p className="mt-4 text-sm text-muted-foreground">Carregando mural...</p>}
      {!carregando && avisos.length === 0 && (
        <p className="mt-5 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhum aviso {filtro ? 'nesta categoria' : 'publicado'}.
        </p>
      )}

      <div className="mt-5 space-y-4">
        {avisos.map((a) => (
          <article
            key={a.id}
            className={cn(
              'rounded-xl border bg-card p-5 shadow-[var(--shadow-soft)]',
              a.prioridade === 'URGENTE' ? 'border-destructive/40' : 'border-border',
            )}
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
                {dataHora(a.publicadoEm)} · {a.autor}
                {a.editado ? ' · editado' : ''}
              </span>
              {podePublicar && (
                <span className="ml-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg"
                    onClick={() => abrir(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-lg text-destructive hover:text-destructive"
                    onClick={() => excluir(a)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </Button>
                </span>
              )}
            </div>
            <h2 className="mt-3 text-base font-bold text-foreground">{a.titulo}</h2>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{a.corpo}</p>

            {a.anexos.map((x) => (
              <a
                key={x.id}
                href={`/api/avisos/${a.id}/anexos/${x.id}`}
                download={x.nome}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 sm:w-auto sm:max-w-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {x.nome}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {TIPO[x.mime] ?? 'Arquivo'} · {tamanho(x.tamanho)}
                  </span>
                </span>
                <Download className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            ))}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Lido por {a.leituras} pessoa(s)</span>
              {a.lido ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" /> Leitura confirmada
                </span>
              ) : (
                <Button size="sm" className="rounded-xl" onClick={() => ler(a)}>
                  Confirmar leitura
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando?.id ? 'Editar aviso' : 'Novo aviso'}</DialogTitle>
            <DialogDescription>
              O aviso aparece no mural de todos os moradores, da portaria e do síndico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="a-titulo">Título</Label>
              <Input
                id="a-titulo"
                value={form.titulo}
                onChange={set('titulo')}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-cat">Categoria</Label>
                <select
                  id="a-cat"
                  value={form.categoriaId}
                  onChange={set('categoriaId')}
                  className={SELECT_CLASSE}
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-prio">Urgência</Label>
                <select
                  id="a-prio"
                  value={form.prioridade}
                  onChange={set('prioridade')}
                  className={SELECT_CLASSE}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-corpo">Comunicado</Label>
              <Textarea
                id="a-corpo"
                rows={6}
                value={form.corpo}
                onChange={set('corpo')}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-anexo">
                {editando?.anexos?.length ? 'Trocar anexo (opcional)' : 'Anexo (opcional)'}
              </Label>
              <Input
                id="a-anexo"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                className="h-11 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">PDF, PNG ou JPG de até 2 MB.</p>
              {editando?.anexos?.length > 0 && !arquivo && (
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={removerAnexo}
                    onChange={(e) => setRemoverAnexo(e.target.checked)}
                  />
                  Remover o anexo atual ({editando.anexos[0].nome})
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              {editando?.id ? 'Salvar' : 'Publicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
