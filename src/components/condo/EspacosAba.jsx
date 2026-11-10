'use client';

/**
 * Aba Espaços da Administração: o síndico cadastra, edita e desativa espaços comuns.
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { CalendarDays, Loader2, Pencil, Plus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { enviarJson, lerResposta } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

// Formulário vazio e formatação do valor em reais.
const vazio = { nome: '', descricao: '', capacidade: '20', valor: '0', ativo: true };
const taxa = (v) =>
  v > 0 ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Isento';

/** RF.09 (Sprint 3): o síndico cadastra, edita e desativa os espaços de reserva. */
export function EspacosAba() {
  // Estado: lista de espaços e formulário aberto (novo ou edição).
  const [espacos, setEspacos] = useState(null);
  const [editando, setEditando] = useState(null); // null = fechado; {} = novo; espaço = edição
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);

  // Busca os espaços na API.
  const carregar = useCallback(async () => {
    try {
      const d = await lerResposta(await fetch('/api/admin/espacos', { cache: 'no-store' }));
      setEspacos(d.espacos);
    } catch (e) {
      toast.error(e.message);
      setEspacos([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Abre o formulário vazio (novo) ou com os dados do espaço (edição).
  const abrir = (e) => {
    setEditando(e ?? {});
    setForm(
      e
        ? {
            nome: e.nome,
            descricao: e.descricao,
            capacidade: String(e.capacidade),
            valor: String(e.valor),
            ativo: e.ativo,
          }
        : vazio,
    );
  };

  // Cria ou atualiza o espaço.
  const salvar = async () => {
    setSalvando(true);
    const corpo = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      capacidade: form.capacidade,
      valor: String(form.valor).replace(',', '.'),
      ativo: form.ativo,
    };
    try {
      if (editando?.id) {
        await enviarJson(`/api/admin/espacos/${editando.id}`, 'PUT', corpo);
        toast.success('Espaço atualizado.');
      } else {
        await enviarJson('/api/admin/espacos', 'POST', corpo);
        toast.success('Espaço cadastrado. Ele já aparece na tela de reservas.');
      }
      setEditando(null);
      await carregar();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Desenho da tela (JSX).
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Espaços de reserva</h2>
          <p className="text-sm text-muted-foreground">
            Espaços desativados somem da tela de reservas; as reservas já feitas continuam valendo.
          </p>
        </div>
        <Button className="rounded-xl" onClick={() => abrir(null)}>
          <Plus className="h-4 w-4" /> Novo espaço
        </Button>
      </div>

      {!espacos && <p className="mt-4 text-sm text-muted-foreground">Carregando espaços...</p>}
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {espacos?.map((e) => (
          <article
            key={e.id}
            className={cn('rounded-xl border border-border p-4', !e.ativo && 'opacity-60')}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CalendarDays className="h-4 w-4 text-primary" /> {e.nome}
              </h3>
              <Badge
                className={cn(
                  'rounded-full border-0 text-[11px]',
                  e.ativo ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground',
                )}
              >
                {e.ativo ? 'Ativo' : 'Desativado'}
              </Badge>
            </div>
            <p className="mt-1 min-h-8 text-xs text-muted-foreground">{e.descricao}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {e.capacidade} pessoas
              </span>
              <span className="font-semibold text-foreground">{taxa(e.valor)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {e.reservasFuturas} reserva(s) futura(s)
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full rounded-lg"
              onClick={() => abrir(e)}
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          </article>
        ))}
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando?.id ? `Editar ${editando.nome}` : 'Novo espaço'}</DialogTitle>
            <DialogDescription>
              Os moradores reservam por turno; a capacidade limita o número de convidados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="e-nome">Nome</Label>
              <Input
                id="e-nome"
                value={form.nome}
                onChange={set('nome')}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-desc">Descrição (opcional)</Label>
              <Input
                id="e-desc"
                value={form.descricao}
                onChange={set('descricao')}
                maxLength={300}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="e-cap">Capacidade (pessoas)</Label>
                <Input
                  id="e-cap"
                  type="number"
                  min={1}
                  value={form.capacidade}
                  onChange={set('capacidade')}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e-valor">Taxa (R$, 0 = isento)</Label>
                <Input
                  id="e-valor"
                  inputMode="decimal"
                  value={form.valor}
                  onChange={set('valor')}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            {editando?.id && (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                />
                Disponível para reserva
              </label>
            )}
            {editando?.id && !form.ativo && editando.reservasFuturas > 0 && (
              <p className="text-xs text-warning-foreground">
                Este espaço tem {editando.reservasFuturas} reserva(s) futura(s), que continuarão
                valendo.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button className="rounded-xl" onClick={salvar} disabled={salvando}>
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
