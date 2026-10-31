'use client';

import { LogIn, LogOut, QrCode, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/condo/AppLayout';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCondo } from '@/lib/condo-store';
import { cn } from '@/lib/utils';
const vazio = { nome: '', documento: '', unidade: '', placa: '', previsao: '' };
export default function Portaria() {
  const { estado, criarVisitante, atualizarVisitante, gerarPasse } = useCondo();
  const [form, setForm] = useState(vazio);
  const [passe, setPasse] = useState(null);
  const cadastrar = () => {
    if (!form.nome || !form.documento || !form.unidade) {
      toast.error('Preencha nome, documento e unidade de destino.');
      return;
    }
    criarVisitante({ ...form, placa: form.placa || '—', previsao: form.previsao || '--:--' });
    toast.success(`Visitante ${form.nome} liberado e aguardando na portaria`);
    setForm(vazio);
  };
  const campos = [
    { chave: 'nome', rotulo: 'Nome completo', placeholder: 'ex: Paulo Henrique Tavares' },
    { chave: 'documento', rotulo: 'Documento (RG/CPF)', placeholder: 'ex: 384.221.900-12' },
    { chave: 'unidade', rotulo: 'Unidade de destino', placeholder: 'ex: Apto 104 - Bloco B' },
    { chave: 'placa', rotulo: 'Placa do carro', placeholder: 'ex: QRS-4C87' },
    { chave: 'previsao', rotulo: 'Previsão de entrada', placeholder: '14:30', tipo: 'time' },
  ];
  return (
    <AppLayout
      titulo="Portaria & Controle de Acesso"
      subtitulo="Cadastro rápido de visitantes e acompanhamento de entradas e saídas"
    >
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserPlus className="h-4.5 w-4.5 text-primary" /> Cadastro rápido de visitante
          </h2>
          <div className="mt-4 space-y-3">
            {campos.map((c) => (
              <div key={c.chave} className="space-y-1.5">
                <Label htmlFor={c.chave}>{c.rotulo}</Label>
                <Input
                  id={c.chave}
                  type={c.tipo ?? 'text'}
                  value={form[c.chave]}
                  placeholder={c.placeholder}
                  onChange={(e) => setForm({ ...form, [c.chave]: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            ))}
            <Button className="mt-2 h-11 w-full rounded-xl" onClick={cadastrar}>
              Liberar visitante
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-bold text-foreground">Movimentação em tempo real</h2>
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
                {estado.visitantes.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <p className="font-semibold text-foreground">{v.nome}</p>
                      <p className="text-xs text-muted-foreground">{v.documento}</p>
                      {v.passe && (
                        <p className="text-xs font-semibold text-primary">Passe: {v.passe}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{v.unidade}</TableCell>
                    <TableCell className="text-sm">{v.placa}</TableCell>
                    <TableCell className="text-sm">
                      {v.previsao}
                      {v.entrada && (
                        <span className="block text-xs text-muted-foreground">
                          Entrada {v.entrada}
                          {v.saida ? ` · Saída ${v.saida}` : ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'rounded-full border-0 text-[11px]',
                          v.status === 'aguardando' && 'bg-warning/15 text-warning-foreground',
                          v.status === 'no-condominio' && 'bg-success/15 text-success',
                          v.status === 'concluido' && 'bg-muted text-muted-foreground',
                        )}
                      >
                        {v.status === 'aguardando'
                          ? 'Aguardando'
                          : v.status === 'no-condominio'
                            ? 'No Condomínio'
                            : 'Concluído'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {v.status === 'aguardando' && (
                          <Button
                            size="sm"
                            className="rounded-lg"
                            onClick={() => {
                              atualizarVisitante(v.id, 'no-condominio');
                              toast.success(`Entrada registrada para ${v.nome}`);
                            }}
                          >
                            <LogIn className="h-3.5 w-3.5" /> Entrada
                          </Button>
                        )}
                        {v.status === 'no-condominio' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={() => {
                              atualizarVisitante(v.id, 'concluido');
                              toast.success(`Saída registrada para ${v.nome}`);
                            }}
                          >
                            <LogOut className="h-3.5 w-3.5" /> Saída
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => {
                            const codigo = gerarPasse(v.id);
                            setPasse({ codigo, nome: v.nome });
                            toast.success('Convite digital gerado com sucesso');
                          }}
                        >
                          <QrCode className="h-3.5 w-3.5" /> Convite
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <Dialog open={!!passe} onOpenChange={(o) => !o && setPasse(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Convite Digital / Passe QR Code</DialogTitle>
            <DialogDescription>
              Envie este passe para {passe?.nome}. Apresente na portaria para liberação imediata.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="grid grid-cols-7 gap-1 rounded-xl border border-border bg-card p-4">
              {Array.from({ length: 49 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-4 w-4 rounded-[2px]',
                    (i * 7 + (passe?.codigo.length ?? 3)) % 3 === 0 ? 'bg-brand-dark' : 'bg-muted',
                  )}
                />
              ))}
            </div>
            <p className="text-sm font-bold tracking-widest text-primary">{passe?.codigo}</p>
            <p className="text-xs text-muted-foreground">Válido por 24 horas</p>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
