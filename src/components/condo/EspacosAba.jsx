'use client';

/**
 * Aba Espaços da Administração: o síndico cadastra, edita e desativa espaços comuns.
 * Componente React de tela (roda no navegador): busca os dados pela API e mostra/edita.
 */

import { CalendarDays, Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Campo,
  Contador,
  LegendaObrigatorio,
  Sugestoes,
  faltando,
  useErros,
} from '@/components/condo/campo';
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
import { enviarJson, lerResposta } from '@/lib/apiClient';
import { formatMoeda, proximoValorMoeda } from '@/lib/masks';
import { cn } from '@/lib/utils';

// Formulário vazio e formatação do valor em reais.
// `valor` fica em centavos (texto): o campo de taxa funciona como o do Pix.
const vazio = { nome: '', descricao: '', capacidade: '20', valor: '0', ativo: true };
const taxa = (v) =>
  v > 0 ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Isento';

/** RF.09 (Sprint 3): o síndico cadastra, edita e desativa os espaços de reserva. */
// Nomes comuns de áreas de condomínio, com uma capacidade inicial sugerida.
const MODELOS_ESPACO = [
  { rotulo: 'Salão de Festas', valor: { nome: 'Salão de Festas', capacidade: '60' } },
  { rotulo: 'Churrasqueira', valor: { nome: 'Churrasqueira', capacidade: '20' } },
  { rotulo: 'Piscina', valor: { nome: 'Piscina', capacidade: '30' } },
  { rotulo: 'Quadra', valor: { nome: 'Quadra Poliesportiva', capacidade: '20' } },
  { rotulo: 'Espaço Gourmet', valor: { nome: 'Espaço Gourmet', capacidade: '25' } },
  { rotulo: 'Brinquedoteca', valor: { nome: 'Brinquedoteca', capacidade: '15' } },
];

// Valores de taxa mais usados (em centavos).
const TAXAS = [
  { rotulo: 'Isento', valor: '0' },
  { rotulo: 'R$ 50', valor: '5000' },
  { rotulo: 'R$ 100', valor: '10000' },
  { rotulo: 'R$ 150', valor: '15000' },
];

export function EspacosAba() {
  // Estado: lista de espaços e formulário aberto (novo ou edição).
  const [espacos, setEspacos] = useState(null);
  const [editando, setEditando] = useState(null); // null = fechado; {} = novo; espaço = edição
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useErros(form);

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
    setErros({});
    setForm(
      e
        ? {
            nome: e.nome,
            descricao: e.descricao,
            capacidade: String(e.capacidade),
            valor: String(Math.round(Number(e.valor) * 100)),
            ativo: e.ativo,
          }
        : vazio,
    );
  };

  // Cria ou atualiza o espaço.
  // Exclui espaço cadastrado por engano (só aparece para quem nunca teve reserva).
  const excluir = async (e) => {
    if (!window.confirm(`Excluir o espaço "${e.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await lerResposta(await fetch(`/api/admin/espacos/${e.id}`, { method: 'DELETE' }));
      toast.success('Espaço excluído.');
      await carregar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const salvar = async () => {
    // Confere os obrigatórios antes de enviar.
    const vazios = faltando(form, ['nome', 'capacidade', 'valor']);
    setErros(vazios);
    if (Object.keys(vazios).length) {
      toast.error('Preencha os campos obrigatórios destacados.');
      return;
    }
    setSalvando(true);
    const corpo = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      capacidade: form.capacidade,
      valor: (Number(form.valor) / 100).toFixed(2), // centavos -> reais com 2 casas
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
      setErros(e.campos ?? {});
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
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 rounded-lg"
                onClick={() => abrir(e)}
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              {e.podeExcluir && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => excluir(e)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              )}
            </div>
            {!e.podeExcluir && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Tem histórico de reservas: para tirar das reservas, edite e desmarque
                &quot;Disponível para reserva&quot;.
              </p>
            )}
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
            <LegendaObrigatorio />
            <Campo id="e-nome" label="Nome" obrigatorio erro={erros.nome}>
              <Input
                id="e-nome"
                value={form.nome}
                onChange={set('nome')}
                className="h-11 rounded-xl"
              />
              {!editando?.id && (
                <Sugestoes
                  itens={MODELOS_ESPACO}
                  ativo={MODELOS_ESPACO.find((m) => m.valor.nome === form.nome)?.rotulo}
                  onEscolher={(v) => setForm({ ...form, ...v })}
                />
              )}
            </Campo>
            <Campo id="e-desc" label="Descrição (opcional)" erro={erros.descricao}>
              <Input
                id="e-desc"
                value={form.descricao}
                onChange={set('descricao')}
                maxLength={300}
                className="h-11 rounded-xl"
              />
            </Campo>
            <div className="grid grid-cols-2 gap-2">
              <Campo id="e-cap" label="Capacidade (pessoas)" obrigatorio erro={erros.capacidade}>
                <Contador
                  id="e-cap"
                  min={1}
                  max={2000}
                  valor={form.capacidade}
                  onChange={(v) => setForm({ ...form, capacidade: v })}
                />
              </Campo>
              <Campo
                id="e-valor"
                label="Taxa (0 = isento)"
                obrigatorio
                erro={erros.valor}
                dica="Digite só os números: os centavos se ajustam sozinhos."
              >
                <Input
                  id="e-valor"
                  inputMode="numeric"
                  autoComplete="off"
                  value={formatMoeda(form.valor)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      valor: String(
                        proximoValorMoeda(form.valor, formatMoeda(form.valor), e.target.value),
                      ),
                    })
                  }
                  className="h-11 rounded-xl text-right font-semibold tabular-nums"
                />
                <Sugestoes
                  rotulo="Atalhos:"
                  itens={TAXAS}
                  ativo={TAXAS.find((t) => t.valor === String(form.valor))?.rotulo}
                  onEscolher={(v) => setForm({ ...form, valor: v })}
                />
              </Campo>
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
