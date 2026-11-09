'use client';

import { Check, LogIn, LogOut, PhoneCall, Search, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { CamposVisitante, SELECT_CLASSE } from '@/components/condo/campos-visitante';
import { VisitaStatus, formatarDataHora } from '@/components/condo/VisitaStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useVisitas } from '@/lib/useVisitas';

const vazio = { nome: '', tipoDocumento: 'CPF', documento: '', unidadeId: '', placa: '' };

const SUCESSO = {
  AUTORIZAR: (v) => `Confirmação por interfone registrada para ${v.nome}`,
  RECUSAR: (v) => `Visita de ${v.nome} recusada`,
  ENTRADA: (v) => `Entrada registrada para ${v.nome}`,
  SAIDA: (v) => `Saída registrada para ${v.nome}`,
};

export default function Portaria() {
  const { visitas, unidades, carregando, erro, criar, acao } = useVisitas();
  const [form, setForm] = useState(vazio);
  const [busca, setBusca] = useState('');
  const [enviando, setEnviando] = useState(false);

  const registrar = async () => {
    setEnviando(true);
    try {
      await criar(form);
      toast.success(`${form.nome} registrado. Aguardando a confirmação do morador.`);
      setForm(vazio);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const executar = async (v, nome) => {
    try {
      await acao(v.id, nome);
      toast.success(SUCESSO[nome](v));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const termo = busca.trim().toLowerCase();
  const filtradas = termo
    ? visitas.filter(
        (v) =>
          v.nome.toLowerCase().includes(termo) ||
          v.convite.toLowerCase().includes(termo) ||
          v.unidade.toLowerCase().includes(termo),
      )
    : visitas;

  return (
    <AppLayout
      titulo="Portaria & Controle de Acesso"
      subtitulo="Visitantes pré-autorizados pelos moradores e registro de quem chegou sem aviso"
    >
      {erro && (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </p>
      )}
      <div className="grid gap-5 2xl:grid-cols-[380px_1fr]">
        <section className="order-2 h-fit rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] 2xl:order-1">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserPlus className="h-4.5 w-4.5 text-primary" /> Visitante não previsto
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Para quem chegou sem pré-autorização. A entrada só é liberada depois que o morador
            confirmar pelo app ou pelo interfone.
          </p>
          <div className="mt-4 space-y-3">
            <CamposVisitante form={form} setForm={setForm} />
            <div className="space-y-1.5">
              <Label htmlFor="unidadeId">Unidade de destino</Label>
              <select
                id="unidadeId"
                value={form.unidadeId}
                onChange={(e) => setForm({ ...form, unidadeId: e.target.value })}
                className={SELECT_CLASSE}
              >
                <option value="">Selecione a unidade</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <Button className="mt-2 h-11 w-full rounded-xl" onClick={registrar} disabled={enviando}>
              Registrar e aguardar morador
            </Button>
          </div>
        </section>

        <section className="order-1 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] 2xl:order-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">Movimentação em tempo real</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, unidade ou convite"
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!carregando && filtradas.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma visita no momento.
                    </TableCell>
                  </TableRow>
                )}
                {filtradas.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">{v.nome}</p>
                      <p className="text-xs text-muted-foreground">{v.documento}</p>
                      {v.autorizacaoVia === 'PRE_AUTORIZACAO' && (
                        <p className="text-xs font-semibold text-primary">Convite {v.convite}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{v.unidade}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{v.placa ?? '—'}</TableCell>
                    <TableCell className="text-sm">
                      {formatarDataHora(v.previsao)}
                      {v.entrada && (
                        <span className="block text-xs text-muted-foreground">
                          Entrada {formatarDataHora(v.entrada).slice(-5)}
                          {v.saida ? ` · Saída ${formatarDataHora(v.saida).slice(-5)}` : ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <VisitaStatus status={v.status} via={v.autorizacaoVia} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {v.status === 'AGUARDANDO' && (
                          <>
                            <Button
                              size="sm"
                              className="rounded-lg"
                              onClick={() => executar(v, 'AUTORIZAR')}
                            >
                              <PhoneCall className="h-3.5 w-3.5" /> Confirmado por interfone
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg"
                              onClick={() => executar(v, 'RECUSAR')}
                            >
                              <X className="h-3.5 w-3.5" /> Recusar
                            </Button>
                          </>
                        )}
                        {v.status === 'AUTORIZADO' && (
                          <Button
                            size="sm"
                            className="rounded-lg"
                            onClick={() => executar(v, 'ENTRADA')}
                          >
                            <LogIn className="h-3.5 w-3.5" /> Entrada
                          </Button>
                        )}
                        {v.status === 'PRESENTE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => executar(v, 'SAIDA')}
                          >
                            <LogOut className="h-3.5 w-3.5" /> Saída
                          </Button>
                        )}
                        {['FINALIZADO', 'CANCELADO'].includes(v.status) && (
                          <Check className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
