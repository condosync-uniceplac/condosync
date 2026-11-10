'use client';

/**
 * Campos do visitante usados nos formulários da portaria e do morador.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCpf } from '@/lib/masks';

// Estilo padrão das caixas de seleção (select).
export const SELECT_CLASSE =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Campos comuns do visitante (nome, documento e placa) usados pelo morador e pela portaria. */
export function CamposVisitante({ form, setForm }) {
  const set = (chave) => (e) => setForm({ ...form, [chave]: e.target.value });
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          value={form.nome}
          onChange={set('nome')}
          placeholder="ex: Paulo Henrique Tavares"
          className="h-11 rounded-xl"
        />
      </div>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="tipoDocumento">Documento</Label>
          <select
            id="tipoDocumento"
            value={form.tipoDocumento}
            onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value, documento: '' })}
            className={SELECT_CLASSE}
          >
            <option value="CPF">CPF</option>
            <option value="RG">RG</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="documento">Número</Label>
          <Input
            id="documento"
            value={form.documento}
            inputMode={form.tipoDocumento === 'CPF' ? 'numeric' : 'text'}
            onChange={(e) =>
              setForm({
                ...form,
                documento:
                  form.tipoDocumento === 'CPF' ? formatCpf(e.target.value) : e.target.value,
              })
            }
            placeholder={form.tipoDocumento === 'CPF' ? '000.000.000-00' : 'ex: 1234567'}
            className="h-11 rounded-xl"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="placa">Placa do carro (opcional)</Label>
        <Input
          id="placa"
          value={form.placa}
          onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
          placeholder="ex: ABC-1234 ou ABC1D23"
          maxLength={8}
          className="h-11 rounded-xl"
        />
      </div>
    </>
  );
}
