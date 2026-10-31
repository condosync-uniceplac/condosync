'use client';

import { ImagePlus, Plus } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatarData, useCondo } from '@/lib/condo-store';
import { cn } from '@/lib/utils';
const CATEGORIAS = ['Barulho', 'Vaga de Garagem', 'Manutenção', 'Limpeza'];
const URGENCIAS = ['Baixa', 'Média', 'Alta'];
const COLUNAS = [
  { id: 'aberto', titulo: 'Aberto', cor: 'bg-destructive' },
  { id: 'analise', titulo: 'Em Análise', cor: 'bg-warning' },
  { id: 'resolvido', titulo: 'Resolvido', cor: 'bg-success' },
];
export default function Chamados() {
  const { estado, usuario, criarChamado, moverChamado } = useCondo();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Barulho');
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState('Média');
  const [anexo, setAnexo] = useState();
  const enviar = () => {
    if (!titulo || !descricao) {
      toast.error('Informe o título e a descrição da ocorrência.');
      return;
    }
    criarChamado({
      titulo,
      categoria,
      descricao,
      urgencia,
      autor: usuario?.nome ?? 'Morador',
      unidade: usuario?.cargo ?? 'Apto 104 - Bloco B',
      ...(anexo ? { anexo } : {}),
    });
    toast.success('Chamado aberto com sucesso! Protocolo enviado à administração.');
    setAberto(false);
    setTitulo('');
    setDescricao('');
    setAnexo(undefined);
    setUrgencia('Média');
  };
  return (
    <AppLayout
      titulo="Chamados & Ocorrências"
      subtitulo="Registre ocorrências e acompanhe a resolução pela administração"
    >
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogTrigger asChild>
          <Button className="rounded-xl">
            <Plus className="h-4 w-4" /> Registrar Ocorrência
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova ocorrência</DialogTitle>
            <DialogDescription>
              Descreva o ocorrido para que a administração possa tomar as providências.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="ex: Infiltração na garagem do Bloco B"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nível de urgência</Label>
                <Select value={urgencia} onValueChange={(v) => setUrgencia(v)}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCIAS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhe o que aconteceu, local e horário."
                className="min-h-24 rounded-xl"
              />
            </div>

            <button
              onClick={() => {
                setAnexo('foto-ocorrencia.jpg');
                toast.success('Foto anexada à ocorrência');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ImagePlus className="h-4 w-4" />
              {anexo ? `Anexado: ${anexo}` : 'Anexar foto (simulado)'}
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={enviar}>
              Abrir chamado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {COLUNAS.map((col) => {
          const itens = estado.chamados.filter((c) => c.status === col.id);
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
                {itens.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Nenhum chamado nesta etapa.
                  </p>
                )}
                {itens.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-xl border border-border bg-background p-4 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {c.categoria}
                      </Badge>
                      <Badge
                        className={cn(
                          'rounded-full border-0 text-[10px]',
                          c.urgencia === 'Alta' && 'bg-destructive/10 text-destructive',
                          c.urgencia === 'Média' && 'bg-warning/15 text-warning-foreground',
                          c.urgencia === 'Baixa' && 'bg-muted text-muted-foreground',
                        )}
                      >
                        Urgência {c.urgencia}
                      </Badge>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-foreground">{c.titulo}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.descricao}</p>
                    {c.anexo && (
                      <p className="mt-2 text-[11px] font-semibold text-primary">📎 {c.anexo}</p>
                    )}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {c.autor} · {c.unidade} · {formatarData(c.data)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {COLUNAS.filter((o) => o.id !== c.status).map((o) => (
                        <Button
                          key={o.id}
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs"
                          onClick={() => {
                            moverChamado(c.id, o.id);
                            toast.success(`Chamado movido para "${o.titulo}"`);
                          }}
                        >
                          {o.titulo}
                        </Button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </AppLayout>
  );
}
