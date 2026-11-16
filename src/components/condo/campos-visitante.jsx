'use client';

/**
 * Campos do visitante usados nos formulários da portaria e do morador.
 * Ao digitar o nome, sugere visitantes já cadastrados; escolhendo um, nome, documento e placa
 * são preenchidos e a visita usa o cadastro existente (o documento aparece mascarado).
 */

import { UserCheck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Campo } from '@/components/condo/campo';
import { Input } from '@/components/ui/input';
import { formatCpf } from '@/lib/masks';

// Estilo padrão das caixas de seleção (select).
export const SELECT_CLASSE =
  'h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const dataCurta = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

/** Busca as sugestões na API depois que a pessoa para de digitar (300 ms). */
function useSugestoesVisitante(termo, ativo) {
  const [lista, setLista] = useState([]);
  useEffect(() => {
    if (!ativo || termo.trim().length < 2) {
      setLista([]);
      return undefined;
    }
    const controle = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/visitas/sugestoes?busca=${encodeURIComponent(termo.trim())}`, {
        signal: controle.signal,
        cache: 'no-store',
      })
        .then((r) => (r.ok ? r.json() : { visitantes: [] }))
        .then((d) => setLista(d.visitantes ?? []))
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      controle.abort();
    };
  }, [termo, ativo]);
  return lista;
}

/**
 * Campos comuns do visitante (nome, documento e placa) usados pelo morador e pela portaria.
 * `erros` = { campo: mensagem } para marcar os campos com problema.
 */
export function CamposVisitante({ form, setForm, erros = {} }) {
  const [focado, setFocado] = useState(false);
  const caixa = useRef(null);
  const escolhido = !!form.visitanteId;
  const sugestoes = useSugestoesVisitante(form.nome, focado && !escolhido);

  const set = (chave) => (e) => setForm({ ...form, [chave]: e.target.value });

  // Escolher uma sugestão preenche tudo e guarda o id do visitante.
  const escolher = (v) => {
    setForm({
      ...form,
      visitanteId: v.id,
      nome: v.nome,
      tipoDocumento: v.tipoDocumento,
      documento: v.documento,
      placa: v.placa || form.placa,
    });
    setFocado(false);
  };

  // "Trocar": volta ao preenchimento manual.
  const limpar = () =>
    setForm({ ...form, visitanteId: '', nome: '', documento: '', tipoDocumento: 'CPF' });

  // Fecha a lista ao clicar fora.
  useEffect(() => {
    const fora = (e) => caixa.current && !caixa.current.contains(e.target) && setFocado(false);
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  return (
    <>
      <div ref={caixa} className="relative">
        <Campo
          id="nome"
          label="Nome completo"
          obrigatorio
          erro={erros.nome}
          dica={!escolhido ? 'Digite 2 letras para ver os visitantes já cadastrados.' : undefined}
        >
          <div className="relative">
            <Input
              id="nome"
              autoComplete="off"
              value={form.nome}
              readOnly={escolhido}
              onFocus={() => setFocado(true)}
              onChange={set('nome')}
              placeholder="ex: Paulo Henrique Tavares"
              className="h-11 rounded-xl pr-24"
            />
            {escolhido && (
              <button
                type="button"
                onClick={limpar}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-accent"
              >
                <X className="h-3.5 w-3.5" /> Trocar
              </button>
            )}
          </div>
        </Campo>
        {sugestoes.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
            {sugestoes.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => escolher(v)}
                  className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-accent"
                >
                  <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{v.nome}</span>
                    <span className="block text-xs text-muted-foreground">
                      {v.tipoDocumento} {v.documento}
                      {v.placa ? ` · Placa ${v.placa}` : ''} · última visita{' '}
                      {dataCurta(v.ultimaVisita)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <Campo id="tipoDocumento" label="Documento" obrigatorio erro={erros.tipoDocumento}>
          <select
            id="tipoDocumento"
            value={form.tipoDocumento}
            disabled={escolhido}
            onChange={(e) => setForm({ ...form, tipoDocumento: e.target.value, documento: '' })}
            className={SELECT_CLASSE}
          >
            <option value="CPF">CPF</option>
            <option value="RG">RG</option>
          </select>
        </Campo>
        <Campo id="documento" label="Número" obrigatorio erro={erros.documento}>
          <Input
            id="documento"
            value={form.documento}
            readOnly={escolhido}
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
        </Campo>
      </div>
      <Campo id="placa" label="Placa do carro (opcional)" erro={erros.placa}>
        <Input
          id="placa"
          value={form.placa}
          onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
          placeholder="ex: ABC-1234 ou ABC1D23"
          maxLength={8}
          className="h-11 rounded-xl"
        />
      </Campo>
    </>
  );
}
